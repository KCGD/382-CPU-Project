MOV     x0, 0       # a
MOV     x1, 1       # b
MOV     x2, 0       # c
MOV     x4, 0       # iterator
B       fib

fibmath:
    ADD     x2, x0, x1
    MOV     x0, x1
    MOV     x1, x2
    B       fibstr

fib:
    B       fibmath
    
fibstr:
    STR     x2, x4, 0
    ADD     x4, x4, 1
    CMP     x4, 7
    BEQ     bye
    B       fib

bye:
B   bye