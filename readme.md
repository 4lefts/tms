* TMS
tms is a simple program that uses a [thue-morse sequence] to generate an l-system-like string which is used to trigger (or not trigger) a note.

the sequence is generated by recursively concatinating the input sequence with the bitwise negatation of itself (eg: 01 -> 0110, 0110 -> 01101001, etc). the module tm.js deals with this.

program generates a motif of midi notes using a wieghted random function to choose from a scale. once the sequencer gets to the end of a loop and wraps around, an offset is then added to the second sequencer so that the second synth drifts out of phase with the first, a la steve reich. kinda.

[thue-morse sequence]: http://wikipedia.org/thue-morse-sequence