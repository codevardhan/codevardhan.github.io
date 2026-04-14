---
title: Creating a Linked List in Hack Assembly - A Nand2Tetris Project
date: 2019-11-10 10:05:55 +0530
author: codevardhan
image: /images/nand2tetris_linked_list/img_main.jpg
tags: [programming, nand2tetris, hack]
---

[Nand2Tetris](https://www.nand2tetris.org/) is one of those rare courses that actually delivers on its premise, you build a working computer from NAND gates up, layer by layer, until you're running programs on hardware you designed yourself. By the end you've built the CPU, the assembler, a VM translator, and a compiler. This post is from somewhere in the middle of that journey: implementing a linked list directly in Hack assembly, the native machine language of the Hack computer.

## The environment

The Hack computer is a 16-bit Von Neumann machine. It has two registers (`A` and `D`), a program counter, and RAM. That's it. No stack pointer you didn't build yourself, no dynamic allocation, no stdlib. When I say "implementing a linked list", I mean manually tracking pointers and data values in raw RAM addresses.

The assembler converts Hack assembly into binary. Labels like `(LOOP)` become jump targets. Every instruction either sets the A register (`@value`) or performs a computation on A, D, and M (where M is `RAM[A]`).

## How the linked list is represented

Each node occupies two consecutive memory locations:

```
RAM[ptr]   = data value
RAM[ptr+1] = address of next node (or negative if end of list)
```

There's no `malloc`. You tell the program where to put each node by inputting the address manually. Crude, but it forces you to actually think about what a pointer is.

![Structure of a simple linked list](/images/nand2tetris_linked_list/linkedlist_figure.png)

## Building the list

The program reads input from the keyboard register (`KBD`). The `@48` subtraction converts ASCII digit input to an integer (ASCII `'0'` = 48).

**Step 1: First node:**

```asm
@KBD          // read address for first node
D=M
@48
D=D-A
@ptr
M=D           // ptr = input - 48

@KBD          // read data value
D=M
@48
D=D-A
@data
M=D           // data = input - 48

@data         // store data at address ptr
D=M
@ptr
A=M
M=D

@ptr          // save first pointer for later traversal
D=M
@ptr1
M=D
```

**Step 2: Subsequent nodes (loop):**

Each iteration reads a new address and data value, writes the address into the current node's "next" slot, then updates the current pointer.

```asm
(LOOP)
@KBD          // read next node address
D=M
@48
D=D-A

@ptr          // write next address into current node's pointer slot
A=M
A=A+1
M=D
@ptr
M=D

@END1         // negative value = end of list
D;JLT

@KBD          // read next data value
D=M
@48
D=D-A

@data
M=D
@ptr          // write data into new node
A=M
M=D

@LOOP
0;JMP

(END1)
```

![Updating the first node](/images/nand2tetris_linked_list/linkedlist_first.png)

## Traversing the list

The search loop uses four variables:
- `i` - current iteration count
- `search` - the index we're looking for
- `temp` - current node pointer
- `ptr1` - saved head pointer

```asm
@i
M=0

@KBD          // read target index
D=M
@48
D=D-A
@search
M=D

@COPY1        // index 0 = first node, skip loop
D;JEQ

@ptr1         // start from head, jump to next pointer slot
A=M+1
D=M

(LOOP2)
@temp         // store current pointer
M=D
@i
M=M+1
D=M

@search       // check if i == search
D=M-D
@COPY
D;JEQ

@temp         // advance to next node
A=M+1
D=M

@LOOP2
0;JMP

(COPY)        // found it, copy data to RAM[100]
@temp
A=M
D=M
@100
M=D

@END
0;JMP

(COPY1)       // index 0, copy from head directly
@ptr1
A=M
D=M
@100
M=D

(END)
@END
0;JMP
```

## Full program

```asm
@KBD
D=M
@48
D=D-A
@ptr          
M=D

@KBD
D=M
@48
D=D-A
@data
M=D

@data
D=M
@ptr
A=M
M=D

@ptr
D=M
@ptr1
M=D

(LOOP)
@KBD
D=M
@48
D=D-A

@ptr
A=M
A=A+1
M=D
@ptr
M=D

@END1
D;JLT

@KBD
D=M
@48
D=D-A

@data
M=D
@ptr
A=M
M=D

@LOOP
0;JMP

(END1)

@i
M=0

@KBD
D=M
@48
D=D-A
@search
M=D

@COPY1
D;JEQ

@ptr1
A=M+1
D=M

(LOOP2)
@temp
M=D
@i
M=M+1
D=M

@search
D=M-D
@COPY
D;JEQ

@temp
A=M+1
D=M

@LOOP2
0;JMP

(COPY)
@temp                    
A=M
D=M
@100
M=D

@END
0;JMP

(COPY1)
@ptr1
A=M
D=M
@100
M=D

(END)
@END
0;JMP
```

## Result

After running the program, RAM shows the linked list nodes with their data and next-pointer values at the addresses you specified. The target index's data ends up in `RAM[100]`.

![RAM after program execution](/images/nand2tetris_linked_list/linkedlist_third.png)

![Loop second iteration](/images/nand2tetris_linked_list/linkedlist_second.png)

## Limitations worth noting

The keyboard input trick (`D=D-A` with `@48`) only works for single-digit inputs. You'd need a proper multi-digit parser for anything realistic. The "negative pointer = end of list" sentinel also means you can't store negative data values, which is a real constraint.

That said, the point of Nand2Tetris isn't to build production software, it's to understand that every abstraction you rely on (dynamic allocation, data structures, even function calls) is something a computer has to physically do in RAM. Building a linked list at this level makes that concrete in a way that no higher-level implementation really can.