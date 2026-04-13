---
title: Creating a Linked List in Hack Language - A Nand2Tetris Project Breakdown
date: 2019-11-10 10:05:55 +0530
author: codevardhan
image: /images/nand2tetris_linked_list/img_main.jpg
tags: [programming, beginnner, nand2tetris, hack]
---

# Creating a Linked List in Hack Language: A Nand2Tetris Project Breakdown

If you're fascinated by the intricacies of computer engineering, then you might have stumbled upon the Nand2Tetris course. This comprehensive program takes you through the journey of building a computer from scratch, delving deep into fundamental concepts like boolean logic, sequential logic, and computer architecture, to name a few. One intriguing aspect is working with the Hack computer, a 16-bit Von Neumann system, and its native Hack language. Today, we're exploring an exciting project from this realm: implementing a linked list using Hack language.

## Understanding Linked Lists and Hack Language

Before we dive into the project, let's establish what linked lists are. Unlike arrays, linked lists are dynamic data structures, meaning they can easily adapt to data size without extensive memory operations, making them ideal for certain applications.

![Structure of a simple linked list](/images/nand2tetris_linked_list/linkedlist_figure.png)

*Fig - This diagram represents a basic linked list structure.*

The Hack language, integral to Nand2Tetris, operates within this Hack computer environment. Developers write software in this machine language, which the built-in assembler then converts into binary code. Our goal? To implement a linked list in this unique setting.

## Breaking Down the Solution

Our strategy is straightforward. We handle linked list nodes as register pairs, one for data and the other for the address of the subsequent node. We use two key variables: 'ptr' for the next node's address and 'data' for the node's data. Both are dynamically updated during the program's execution.

### Inputting Initial Values:
1. **First Pointer**: We input the initial pointer value and store it in the 'ptr' variable.
2. **First Data Value**: Similarly, we input the first data value, storing it in the 'data' variable.
3. **Node Initialization**: The 'data' value is then assigned to the address contained in 'ptr'.

![Updating the first node](/images/nand2tetris_linked_list/linkedlist_first.png)

*Fig - Here, we're updating the first node with new data.*

### Creating the Linked List:
- The program prompts for the next node's address, with these values inputted through a loop for each new node.
- The pointer ('ptr') is updated with the new address, and if it's null (i.e., pointing to zero), the loop terminates. Otherwise, it continues, prompting for the next data value.

### Retrieving Data from the List:
- We employ a loop and four variables ('i' for iterations, 'search' for the list index, 'temp' for the current pointer, and 'ptr1' for the first pointer) to navigate through the linked list.
- The program asks for the required index and iterates through the nodes until it finds the correct one. If found, the data value from the specified node is copied to a predetermined register (e.g., the 100th register).

![Loop Iteration](/images/nand2tetris_linked_list/linkedlist_second.png)

*Fig - The loop is operating in its second iteration.*

### The Code:
- The Hack language code includes input handling, loop operations, node updates, and conditions for terminating the loop or copying data. It's a structured yet low-level approach, highlighting the intricacies of working with machine language.

```
@KBD                        //Input first pointer value.
D=M
@48
D=D-A
@ptr          
M=D

@KBD                         //Input first data value.
D=M
@48
D=D-A
@data
M=D

@data                        //Assigning data to pointer.
D=M
@ptr
A=M
M=D

@ptr                         //Storing value of first pointer.
D=M
@ptr1
M=D

(LOOP)
@KBD                          //Input next pointer.
D=M
@48
D=D-A

@ptr                          //Updating node with next pointer value.
A=M
A=A+1
M=D
@ptr
M=D

@END1                         //Checking if pointer is null.
D;JLT

@KBD                          //Input next data.
D=M
@48
D=D-A

@data                         //Updating new node with data.
M=D
@ptr
A=M
M=D

@LOOP                          //Jump to loop
0;JMP

(END1)

@i                             //i variable for iteration
M=0

@KBD                           //Enter the position of data to be found
D=M
@48
D=D-A
@search
M=D

@COPY1                         //Checks if the position is zero and jumps to function 'COPY!' 
D;JEQ

@ptr1                          //Goes to the next pointer location
A=M+1
D=M

(LOOP2)
@temp                          //Stores the value of the current pointer in the temp variable
M=D
@i
M=M+1
D=M

@search                        //Checks if the index is equal to ‘i’ and jumps to ‘COPY’ function
D=M-D
@COPY
D;JEQ

@temp                          //Goes to the next pointer location
A=M+1
D=M

@LOOP2                         //Jumps to beginning of loop.
0;JMP

(COPY)                         //Copies data from required node to 100t register in RAM
@temp                    
A=M
D=M
@100
M=D

@END                           //Jumps to end  
0;JMP

(COPY1)                        //Copies data from first node to 100th register in RAM
@ptr1
A=M
D=M
@100
M=D

(END)                           //Jumps to end
@END
0;JMP

```
## Results: Seeing the Linked List in Action

After running the program, we can observe the RAM registers' state, which should now reflect the nodes of our linked list with their respective data values and addresses. It's a testament to the successful implementation of a linked list in the Hack language environment.

![RAM after program execution](/images/nand2tetris_linked_list/linkedlist_third.png)

*Fig - The RAM showing data values at specified nodes, confirming our implementation works.*

## Wrapping Up

This project underscores not only the versatility of data structures like linked lists but also the foundational understanding Nand2Tetris promotes. By implementing a linked list in Hack language, we've navigated machine-level operations and data management, essential skills for any budding computer scientist or seasoned software engineer keen on grasping computer operation at its most fundamental level.
