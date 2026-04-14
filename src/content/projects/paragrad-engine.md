---
title: Paragrad Autograd Engine!
date: 2026-04-13 12:12:11 +0530
image: /images/paragrad/paragrad.png
author: codevardhan
tags: [autograd, cuda, cpp]

usemathjax: true
---

# I Built a Deep Learning Framework from Scratch in C++/CUDA. Here's What I Learned About GPUs, Memory, and Why PyTorch Is the Way It Is.

*4,000 lines of C++17. 19 primitive operations. Three backends. Zero dependencies. One month.*

---

Most people learn CUDA by writing a matrix multiply kernel and calling it a day. I wanted to understand the full stack in a machine learning context, from how `loss.backward()` actually works, down to why cuBLAS is 4x faster than anything I could write by hand. So I built [ParaGrad](https://github.com/codevardhan/paragrad): a complete autograd engine and deep learning framework in C++17/CUDA, designed around one architectural bet that turned out to be the most interesting part of the project.

The bet: you can express the entire compute layer of neural network training in ~19 primitive tensor operations. Everything else, the autograd engine, the optimizer, the training loop, the diagnostics, lives above a single abstraction boundary and never touches hardware-specific code. Swapping from CPU to GPU is one build flag. Adding a new accelerator means writing one file.

In the end I was able to train transformers with this. It has 886 tests. And the performance numbers surprised me in ways that taught me more about GPU architecture than any textbook.

## The Architecture: One Boundary, Three Backends

The idea comes from [tinygrad](https://github.com/tinygrad/tinygrad): if you shrink the operation set small enough, the abstraction boundary becomes trivially thin, and "portability" stops being a framework problem and becomes a 500-line-per-backend problem.

```mermaid
graph TB
    subgraph portable["Pure C++17 - Hardware-Agnostic"]
        style portable fill:#e8f4e8,stroke:#2d7d2d,stroke-width:2px,color:#1a1a1a
        TL["Training Loop / Optimizer<br/><i>SGD, Adam</i>"]
        AE["Autograd Engine<br/><i>Tape-based reverse-mode AD</i>"]
        GS["Graph Scheduler<br/><i>Op fusion, memory planning, dispatch</i>"]
        TL --> AE --> GS
    end

    BOUND["Abstract Backend Interface - 19 primitives"]
    style BOUND fill:#ff6b6b,stroke:#cc0000,stroke-width:3px,color:#fff

    GS --> BOUND

    subgraph backends["Hardware-Specific - One File per Accelerator"]
        style backends fill:#e8e8f4,stroke:#2d2d7d,stroke-width:2px,color:#1a1a1a
        CPU["CPU Backend<br/><i>OpenMP, tiled GEMM</i>"]
        CUDA["CUDA Backend<br/><i>Hand-written kernels,<br/>NVRTC JIT fusion</i>"]
        CUBLAS["cuBLAS Backend<br/><i>Inherits CUDA,<br/>overrides 3 methods</i>"]
    end

    BOUND --> CPU
    BOUND --> CUDA
    BOUND --> CUBLAS

    CPU -.-> HW1["Cascade Lake CPU"]
    CUDA -.-> HW2["Tesla V100 GPU"]
    CUBLAS -.-> HW2
```

The `Backend` abstract class defines 19 operations across six categories:

| Memory | Unary | Binary | Reduce | Matrix | Transformer |
|--------|-------|--------|--------|--------|-------------|
| alloc | relu | add | sum | gemm | softmax |
| free | neg | mul | | transpose | rmsnorm |
| copy | exp | | | | embedding |
| zero | log | | | | slice |
| | tanh | | | | |
| | pow | | | | |


Every layer, every loss function, every optimizer step is composed exclusively from these primitives. Softmax is `exp(x - max(x))` normalized via `mul` and `sum`. Cross-entropy composes `log`, `mul`, `neg`, and `sum`.

The payoff of this design showed up when I added the cuBLAS backend:

```mermaid
classDiagram
    class Backend {
        &lt;&lt;abstract&gt;&gt;
        +alloc()
        +free()
        +relu() / neg() / exp() / log() / ...
        +add() / mul()
        +sum()
        +gemm()
        +axpy()
        +softmax() / rmsnorm() / ...
    }

    class CpuBackend {
        +alloc() - malloc
        +relu() - OpenMP parallel
        +gemm() - tiled loop
        +axpy() - OpenMP SAXPY
        ... all 19 ops
    }

    class CudaBackend {
        +alloc() - cudaMalloc
        +relu() - grid-stride kernel
        +gemm() - 32x32 shared-mem tiles
        +axpy() - grid-stride kernel
        ... all 19 ops
    }

    class CublasBackend {
        +gemm() - cublasSgemm
        +gemm_backward() - 2x cublasSgemm
        +axpy() - cublasSaxpy
        Everything else inherited
    }

    Backend <|-- CpuBackend
    Backend <|-- CudaBackend
    CudaBackend <|-- CublasBackend
```

The entire cuBLAS implementation overrides exactly **three methods**. Everything else, the element-wise ops, reductions, fusion, the autograd tape, is inherited unchanged. That's the abstraction working as designed.

## The Tape: Why I Threw Away My First Autograd Implementation

My first autograd engine used the textbook approach (mainly inspired by [micrograd](https://github.com/karpathy/micrograd)). Initially I was using a DAG of `shared_ptr<Tensor>` nodes, each storing a closure for its backward pass. It worked. Then I tried to fuse operations across it and hit a wall, closures are opaque. You can't inspect them, reorder them, or merge them without rewriting the entire graph representation.

So I replaced it with a flat linear tape:

```mermaid
graph TB
    subgraph forward["Forward Pass - appends to tape"]
        style forward fill:#e8f4e8,stroke:#2d7d2d,color:#1a1a1a
        F1["GEMM<br/>W×input"] --> F2["ADD<br/>+bias"] --> F3["RELU"] --> F4["GEMM<br/>W2×hidden"] --> F5["SOFTMAX"] --> F6["LOSS"]
    end

    subgraph tape["Tape - flat array of TapeEntry structs"]
        style tape fill:#ffeaa7,stroke:#d4a017,color:#1a1a1a
        T1["[0] GEMM"] --- T2["[1] ADD"] --- T3["[2] RELU"] --- T4["[3] GEMM"] --- T5["[4] SOFTMAX"] --- T6["[5] LOSS"]
    end

    subgraph backward["Backward Pass - reverse iteration"]
        style backward fill:#f4e8e8,stroke:#7d2d2d,color:#1a1a1a
        B6["d_loss"] --> B5["d_softmax"] --> B4["d_GEMM"] --> B3["d_relu"] --> B2["d_add"] --> B1["d_GEMM"]
    end

    forward -.-> tape
    tape -.-> backward
```

Every forward operation appends a `TapeEntry` struct: the op type, input/output tensor indices, and shape metadata. No closures. No pointer chasing. The tape is a mutable intermediate representation between the end of the forward pass and `backward()`, the scheduler can inspect, rewrite, or fuse entries freely.

This design has a property that surprised me: **the tape is already in topological order.** A DAG-based autograd has to sort the graph before backward. The tape doesn't, forward execution order *is* topological order. That's one fewer pass over the data, and it makes the backward walk a trivial reverse iteration over a flat array.

The tape also makes diagnostics trivial. I built three features on top of it:

```mermaid
graph TB
    TAPE["Flat Tape - array of TapeEntry"]
    style TAPE fill:#ffeaa7,stroke:#d4a017,stroke-width:2px,color:#1a1a1a

    TAPE --> D1["Tape Dump<br/><i>Forward graph as table:<br/>op type, tensor indices,<br/>shapes, fused status</i>"]
    TAPE --> D2["Activation Stats<br/><i>mean, variance, min/max,<br/>zero-fraction per intermediate.<br/>Flags dead units and collapse.</i>"]
    TAPE --> D3["Gradient Health<br/><i>L2 norm, max grad magnitude,<br/>dead-gradient fraction.<br/>Detects vanishing/exploding.</i>"]

    style D1 fill:#dfe6e9,stroke:#888,color:#1a1a1a
    style D2 fill:#dfe6e9,stroke:#888,color:#1a1a1a
    style D3 fill:#dfe6e9,stroke:#888,color:#1a1a1a
```

Each diagnostic is ~50 lines of code reading from a flat list. In PyTorch, this kind of introspection requires hooks and callbacks bolted onto a system not designed for it.

## Writing CUDA Kernels: What 500x Means and Where It Comes From

The CPU backend uses OpenMP with 8 threads and a cache-aware tiled GEMM. On transformer-shaped matrices (the kind that actually matter for LLM training), it achieves 1.5–4.0 GFLOP/s. That's far below the Cascade Lake's theoretical peak, and the reason is instructive: the working sets for these shapes exceed L3 cache, so every GEMM tile must be re-fetched from DRAM on every outer-product step.

The CUDA backend on a Tesla V100 achieves 1,563–2,029 GFLOP/s on the same shapes. That's a **500–1,039x speedup.**

Let that number sink in. Not 5x. Not 50x. *Five hundred to one thousand times faster.* And it's not because GPUs are magic, it's because the V100 has 900 GB/s memory bandwidth versus the CPU's 51 GB/s, and 80 streaming multiprocessors that can keep thousands of threads in flight simultaneously. The CPU is DRAM-bandwidth-bound; the GPU simply has more bandwidth.

But here's where it gets interesting. cuBLAS achieves 5,113–7,603 GFLOP/s on the same shapes , another 3.4–4.2x over my hand-written kernels. The gap is entirely attributable to one thing: **Tensor Cores.**

```mermaid
graph LR
    subgraph cpu["CPU Backend"]
        style cpu fill:#ffcccc,stroke:#cc4444,color:#1a1a1a
        C1["8 threads - Tiled GEMM<br/>32×32 tiles, FP32 scalar ops"]
        C2["1.5 – 4.0 GFLOP/s"]
        C1 --> C2
        style C1 fill:#ffeeee,color:#1a1a1a
        style C2 fill:#ffeeee,color:#1a1a1a
    end

    subgraph cuda["CUDA Backend"]
        style cuda fill:#ccddff,stroke:#4466cc,color:#1a1a1a
        D1["80 SMs - Tiled GEMM<br/>32×32 shared mem, FP32 FFMA"]
        D2["1,563 – 2,029 GFLOP/s"]
        D1 --> D2
        style D1 fill:#ddeeff,color:#1a1a1a
        style D2 fill:#ddeeff,color:#1a1a1a
    end

    subgraph cublas["cuBLAS Backend"]
        style cublas fill:#ccffcc,stroke:#44aa44,color:#1a1a1a
        E1["Tensor Cores - WMMA<br/>16×16×16 FP16, auto-tuned"]
        E2["5,113 – 7,603 GFLOP/s"]
        E1 --> E2
        style E1 fill:#eeffee,color:#1a1a1a
        style E2 fill:#eeffee,color:#1a1a1a
    end

    cpu -- "500–1039×" --> cuda
    cuda -- "3.4–4.2×" --> cublas
```

| Shape | CPU (GFLOP/s) | CUDA (GFLOP/s) | cuBLAS (GFLOP/s) |
|-------|---------------|-----------------|-------------------|
| ffn_up_s (64×768×3072) | 2.6 | 1,823 | 7,603 |
| attn_qkv (64×768×2304) | 4.0 | 2,029 | 6,969 |
| ffn_up_m (32×1024×4096) | 1.5 | 1,564 | 5,931 |

This is the most honest lesson from the project: **knowing where your kernel sits on the roofline matters more than micro-optimizing it.** My hand-written GEMM was well-implemented for what it was (FP32 tiled shared-memory kernel), but it was playing the wrong game. The real performance was behind an ISA-level feature (Tensor Cores) that requires a fundamentally different kernel structure. cuBLAS knows this. I now know this too.

### Roofline Positioning

The roofline model makes the story visual. Hardware limits from spec sheets; performance from my benchmarks:

```mermaid
quadrantChart
    title Performance vs. Hardware Ceiling
    x-axis "Approaching Memory Ceiling" --> "Approaching Compute Ceiling"
    y-axis "Low Utilization" --> "High Utilization"
    quadrant-1 "Compute-bound and efficient"
    quadrant-2 "Compute-bound, underutilized"
    quadrant-3 "Memory-bound, underutilized"
    quadrant-4 "Memory-bound and efficient"
    "CPU GEMM kernels": [0.25, 0.10]
    "CUDA hand-written": [0.72, 0.55]
    "cuBLAS Tensor Core": [0.85, 0.82]
```

The CPU is firmly memory-bandwidth-bound, at arithmetic intensities of 15–29 FLOP/byte, our kernels achieve only 1.5–4.6 GFLOP/s, ~35x below the 160 GFLOP/s compute ceiling. The gap is poor L3 reuse: transformer shapes exceed L3 cache. On the V100, hand-written CUDA sits near the FP32 ceiling; cuBLAS climbs toward the Tensor Core ceiling via WMMA half-precision instructions.

## NVRTC Kernel Fusion: The Win That Wasn't (And Why That's the Real Story)

The tape architecture makes operation fusion straightforward. After the forward pass, `Tape::fuse()` scans for contiguous chains of element-wise ops where each intermediate is consumed exactly once, then replaces the chain with a single `FUSED` tape entry:

```mermaid
graph TB
    subgraph before["Before Fusion - 4 kernel launches, 3 intermediate buffers"]
        style before fill:#f4e8e8,stroke:#7d2d2d,color:#1a1a1a
        direction LR
        I["input"]
        NEG["<b>neg()</b><br/>kernel 1 · writes tmp1"]
        EXP["<b>exp()</b><br/>kernel 2 · writes tmp2"]
        TANH["<b>tanh()</b><br/>kernel 3 · writes tmp3"]
        GELU["<b>gelu()</b><br/>kernel 4 · writes output"]
        I --> NEG --> EXP --> TANH --> GELU
        style I fill:#f9d9d9,color:#1a1a1a
        style NEG fill:#f9d9d9,color:#1a1a1a
        style EXP fill:#f9d9d9,color:#1a1a1a
        style TANH fill:#f9d9d9,color:#1a1a1a
        style GELU fill:#f9d9d9,color:#1a1a1a
    end

    subgraph after["After Fusion - 1 kernel launch, 0 intermediate buffers"]
        style after fill:#e8f4e8,stroke:#2d7d2d,color:#1a1a1a
        I2["input"]
        FUSED["<b>fused_neg_exp_tanh_gelu()</b><br/>single NVRTC-compiled kernel<br/>writes output directly"]
        I2 --> FUSED
        style I2 fill:#d9f9d9,color:#1a1a1a
        style FUSED fill:#d9f9d9,color:#1a1a1a
    end

    before -.->|"Tape::fuse()"| after
```

On the CPU, this means one streaming pass instead of N. On the GPU, the fused chain is JIT-compiled into a single CUDA kernel using NVRTC (NVIDIA's runtime compilation API), eliminating intermediate global memory round-trips.

The implementation is about 100 lines of graph analysis and 200 lines of NVRTC codegen. Compare that to `torch.compile`, which is thousands of lines bolted onto a system with hundreds of ops and dynamic dispatch overhead. The ~19-op interface makes the graph trivially analyzable.

But here's the twist: fusion yielded **no measurable end-to-end speedup** on the V100 for transformer workloads. Here's why:

```mermaid
pie title Where Time Goes in a Transformer Step on V100
    "GEMM forward" : 40
    "GEMM backward - d_input" : 25
    "GEMM backward - d_weight" : 25
    "Element-wise ops - all of them" : 7
    "Memory transfers + overhead" : 3
```

On the V100, the GEMM dominates step time at ~2,000 GFLOP/s. The element-wise chain (4 ops over 1M floats) takes ~3ms out of a ~5ms step. Even cutting element-wise time in half saves 1.5ms - lost in measurement noise against the GEMM. The fusion infrastructure exists, is correct (bitwise-exact with unfused output), and would matter when element-wise chains are long or GEMMs are small. But for transformer workloads, the GEMM is king.

## The Bug That Taught Me the Most

Halfway through the project, the Shakespeare language model, a 6-layer, 8.19M parameter decoder-only transformer, started crashing with `corrupted size vs. prev_size`. That's glibc's way of telling you a heap metadata block has been overwritten. No stack trace, no helpful error message.

The root cause was a double-free hidden behind two independent memory management systems:

```mermaid
sequenceDiagram
    participant TL as Training Loop
    participant Tape as Tape Arena
    participant Aux as Aux System
    participant Heap as Heap

    TL->>Tape: forward - records ops + intermediates
    TL->>Aux: make_aux - stores mask, eps, one-hot
    Note over Tape,Aux: Some tensors tracked by BOTH systems
    TL->>Tape: loss.backward
    TL->>TL: optimizer.step

    Note over TL,Heap: ❌ BUG - Original order
    TL->>Aux: clear_aux - deletes tensors
    TL->>Tape: reset_graph - tries to free same tensors
    Tape-->>Heap: DOUBLE FREE - corrupted size vs prev_size
```

```mermaid
sequenceDiagram
    participant TL as Training Loop
    participant Tape as Tape Arena
    participant Aux as Aux System
    participant Heap as Heap

    TL->>Tape: forward - records ops + intermediates
    TL->>Aux: make_aux - stores mask, eps, one-hot
    TL->>Tape: loss.backward
    TL->>TL: optimizer.step

    Note over TL,Heap: ✅ FIX - Reversed order
    TL->>Tape: reset_graph - releases tape refs first
    TL->>Aux: clear_aux - safely deletes, no dangling refs
    Note over Heap: Clean shutdown, no corruption
```

The fix was a one-line reordering. But finding that one line required building with AddressSanitizer, reducing the model to tiny dimensions for fast iteration, and tracing pointer ownership across the tape, the arena, and the auxiliary system.

This bug reinforced something I already believed but now viscerally understand: **memory ownership in C++ is a design problem, not a coding problem.** The fix wasn't better code, it was a clearer ownership model:

```mermaid
graph TB
    subgraph ownership["Ownership Model - after fix"]
        style ownership fill:#e8f4e8,stroke:#2d7d2d,color:#1a1a1a
        TAPE["Tape<br/><i>Owns: graph structure<br/>#40;TapeEntry array#41;</i>"]
        TENSORS["Tensors<br/><i>Own: device buffers<br/>#40;GPU/CPU memory#41;</i>"]
        AUX["Aux System<br/><i>Owns: ONLY tensors<br/>not referenced by tape</i>"]

        TAPE -->|"indices into"| TENSORS
        AUX -->|"manages lifetime of"| TENSORS

        RULE["Rule: reset_graph#40;#41; BEFORE clear_aux#40;#41;<br/>Tape releases refs then Aux safely deletes"]
        style RULE fill:#ffeaa7,stroke:#d4a017,stroke-width:2px
    end
```

## Thread Scaling: The Plateau at 4 Threads

The CPU thread scaling study revealed a clean story:

| Threads | ffn_up_s | ffn_down_s | ffn_up_m | ffn_down_m |
|---------|----------|------------|----------|------------|
| 1 | 2.7 | 3.6 | 1.5 | 2.6 |
| 2 | 2.9 | 4.3 | 1.7 | 3.0 |
| 4 | 3.0 | 4.6 | 1.7 | 3.1 |
| 8 | 2.9 | 4.6 | 1.7 | 3.2 |

```mermaid
xychart-beta
    title "CPU GEMM Throughput vs Thread Count"
    x-axis "Threads" [1, 2, 4, 8]
    y-axis "GFLOP/s" 0 --> 6
    line "ffn_down_s" [3.6, 4.3, 4.6, 4.6]
    line "ffn_up_s" [2.7, 2.9, 3.0, 2.9]
    line "ffn_down_m" [2.6, 3.0, 3.1, 3.2]
    line "ffn_up_m" [1.5, 1.7, 1.7, 1.7]
```

Performance plateaus at 4 threads on an 8-core node. The 1.2x peak scaling from 1 to 4 threads (not 4x) is consistent with DRAM bandwidth saturation, not a compute bottleneck. Adding more threads doesn't help because the memory bus is already the constraint. This is textbook memory-bound behavior, and seeing it in my own code made the roofline model concrete in a way that reading about it never did.

## What I'd Do Differently

**Start with cuBLAS for GEMM from day one.** I spent time optimizing a hand-written tiled GEMM that I knew would never match cuBLAS. The value was educational, I now understand exactly *why* it's slower (Tensor Cores, register blocking, autotuning), but if I were building for production, I'd use cuBLAS for GEMM and spend the optimization time on memory layout and kernel fusion for the non-GEMM ops.

**Design the memory ownership model before writing any ops.** The `make_aux`/`clear_aux` heap corruption cost me two days. An arena allocator with clear epoch-based lifetimes (forward arena, backward arena, optimizer arena) would have prevented the bug entirely and made the code simpler.

**Profile first, optimize second.** The fusion null result taught me this. I built an entire NVRTC JIT compilation pipeline before measuring whether element-wise ops were actually the bottleneck. They weren't. The infrastructure is still valuable (it demonstrates the architecture's extensibility), but I should have benchmarked the baseline first.

## The Numbers

- **886 tests**, 0 failures - unit tests for every op, fusion correctness, cross-backend numerical equivalence, finite-difference gradient verification
- **19 primitive operations** - the complete compute surface for training neural networks
- **~4,000 lines** of C++17/CUDA, zero external dependencies
- **500–1,039x** speedup from CPU to CUDA on transformer-shaped GEMMs
- **3.4–4.2x** additional speedup from cuBLAS via Tensor Cores
- **Three backends** demonstrating the abstraction: adding cuBLAS required overriding 3 methods

```mermaid
graph LR
    subgraph tests["Test Suite: 886 Tests, 0 Failures"]
    style tests fill:#e8f4e8,stroke:#2d7d2d,color:#1a1a1a
        UT["Unit Tests<br/>tensor ops: 124<br/>tape/autograd: 98<br/>fusion: 87<br/>transformer: 112<br/>diagnostics: 64"]
        IT["Integration<br/>MNIST: 48<br/>LM: 61"]
        RT["Regression<br/>fusion bugs: 73<br/>memory safety: 102"]
        XT["Cross-backend<br/>equivalence: 77<br/>gradient FD: 40"]
    end
```

## Why This Matters Beyond the Course

Inference portability is a solved problem. ONNX Runtime, TVM, and llama.cpp handle it well. But *training* portability i.e. running the same training code on different accelerators without framework-level changes is still an open problem. PyTorch's tight CUDA coupling, JAX's XLA dependency, and the fragmented state of AMD/Intel training support all point to the same gap.

ParaGrad doesn't solve this at production scale. But it demonstrates the architectural principle that could: a small, clean operation set with a single abstraction boundary, where hardware-specific code is confined to one file per accelerator and everything else, autograd, optimization, diagnostics; is portable by construction.

The codebase is on [GitHub](https://github.com/codevardhan/paragrad). It compiles with `make`, runs on any CUDA-capable GPU, and trains a transformer on Shakespeare. If you're interested in GPU systems, HPC, or the intersection of compiler infrastructure and deep learning, I'd love to talk about it.

---

*Built for EECE5640 (High Performance Computing) at Northeastern University, Prof. David R. Kaeli. All benchmarks collected on the MGHPCC Explorer cluster (Tesla V100-SXM2-32GB, 8-core Cascade Lake CPU node).*