import math

def find_wrong_bits(string):
    digits = math.ceil(math.log(len(string), 2))
    totals = [0 for _ in range(digits)]
    for i in range(len(string)):
        bits = list(str(bin(i))[2:].rjust(digits, "0"))[::-1]
        for digit in range(digits):
            if bits[digit] == "1" and string[i] == "1":
                totals[digit] += 1
    totals = [i % 2 for i in totals]
    return totals 

def rectify_and_decode(string):
    wrong_bits = find_wrong_bits(string)
    digits = len(wrong_bits)
    wrong_pos = sum([wrong_bits[i] * (2 ** i) for i in range(digits)])
    string = [int(i) for i in string]
    string[wrong_pos] = int(not string[wrong_pos])
    string = [string[i] for i in range(len(string)) if i and math.log(i, 2) % 1]
    print("".join([str(i) for i in string]))
    print(int("".join([str(i) for i in string]), 2))

rectify_and_decode("0100000010000110100000000010000110001100000101010100011001110011")
