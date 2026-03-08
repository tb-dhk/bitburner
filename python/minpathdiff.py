ls = [
         [8],
        [7,7],
       [4,4,1],
      [7,7,9,3],
     [2,9,4,5,9],
    [6,9,2,9,4,1],
   [6,8,1,7,4,2,2],
  [9,8,8,1,2,7,8,6]
]

sums = [i for i in ls]
for row in range(1, len(sums)):
    for cell in range(len(sums[row])):
        minprevsum = min(sums[row-1][max(0, cell-1):cell+1])
        sums[row][cell] = minprevsum + ls[row][cell]

for i in ls:
    print(i)

print(min(ls[-1]))
