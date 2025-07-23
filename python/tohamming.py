import math

def tohamming(number):
    bits = list(map(int, str(bin(number)[2:])))
    parity = math.ceil(math.log(len(bits), 2))
    bits = ["X"] + bits
    for i in range(parity):
        bits.insert(2 ** i, "X")
    print("".join(map(str, bits)))
    totals = [0 for _ in range(parity)]
    for i in range(len(bits)):
        if bits[i] == 1:
            nbits = list(str(bin(i))[2:].rjust(parity, "0"))[::-1]
            for digit in range(parity):
                if nbits[digit] == "1":
                    totals[digit] += 1
    totals = [i % 2 for i in totals]
    for i in range(parity):
        bits[2 ** i] = totals[i]
    bits[0] = bits.count(1) % 2
    print("".join(map(str, bits)))

tohamming(505243456011039)
