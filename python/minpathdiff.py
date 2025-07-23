ls = [
          [1],
         [4,2],
        [5,9,6],
       [6,9,6,9],
      [8,1,7,3,4],
     [8,9,8,8,6,3],
    [3,9,7,9,2,9,3],
   [9,5,9,4,6,9,8,2],
  [9,6,7,2,3,8,2,1,8]
]

sums = [i for i in ls]
for row in range(1, len(sums)):
    for cell in range(len(sums[row])):
        minprevsum = min(sums[row-1][max(0, cell-1):cell+1])
        sums[row][cell] = minprevsum + ls[row][cell]

for i in ls:
    print(i)
