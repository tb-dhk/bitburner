grid = [
[0,0,0,0,0,0,0,0,1,0,0,0,],
[0,0,0,0,0,0,0,0,0,1,0,0,],
[0,0,0,0,1,0,0,0,0,0,0,0,]
]

solution = [[0 if j else 0 for j in i] for i in grid]
solution[0][0] = 1

cells = [(0, 1), (1, 0)]
steps = 2

while cells:
    ncells = []
    for cell in cells:
        row, col = cell
        if not grid[row][col]:
            solution[row][col] = solution[max(row-1, 0)][col] + solution[row][max(col-1, 0)]
            ncells += [(row, col+1), (row+1, col)]
    cells = [i for i in list(set(ncells)) if i[0] >= 0 and i[0] < len(grid) and i[1] >= 0 and i[1] < len(grid[0])]
    print(cells)

for i in solution:
    print(" ".join(map(lambda x: str(x).rjust(2), i)))
