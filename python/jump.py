ls = [2,0,9,0,2,8,3,3,0,0,5,3,6,5,2,9,6,10,2,0,10]

batch = [0]
count = 0
print(ls, len(ls) - 1)
while len(ls) - 1 not in batch:
    final = []
    for i in batch:
        final += list(range(i + 1, i + ls[i] + 1))
    batch = list(set(final))
    print(batch)
    count += 1

print(count)
