def split_chunks(string):
    chunks = []
    new = True 
    while string:
        length = int(string[0])+1
        if len(string) in [2, length]:
            chunks.append(string)
            return chunks
        elif string[0] == "0":
            chunks.append("0")
            string = string[1:]
        elif new:
            chunks.append(string[:length])
            string = string[length:]
        else:
            chunks.append(string[:2])
            string = string[2:]
        new = not new
    return []

main = "7ewkgbpB72456RG480715vEWsF4503398IW8I1FWX09AVewYMtMt92"

chunks = split_chunks(main)

final = ""
for chunk in chunks:
    if len(chunk) == 2 and chunk.isnumeric():
        length = int(chunk[0])
        back = int(chunk[1])
        ref = final[-back:]
        new = ""
        while len(new) < length:
            new += ref
        new = new[:length]
        final += new
    else:
        final += chunk[1:]
    print(chunk, final)
print(final)
