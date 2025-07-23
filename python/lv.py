def split_chunks(string):
    chunks = []
    while string:
        length = int(string[0])+1
        if len(string) == length:
            chunks.append(string)
            return chunks
        if string[length].isnumeric():
            chunks.append(string[:length])
            string = string[length:]
        else:
            chunks.append(string[:2])
            string = string[2:]
    return []

main = "6MPM10F6291buWb0xrz063joGrj897R77LvnR299Lg5b5hVXH088oCKtbCe"

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
