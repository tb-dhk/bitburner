grid = [[0,1,0,0,0,0,0,0,1,0,0],
   [1,0,0,0,0,0,1,0,1,1,0],
   [0,0,0,0,0,1,1,0,1,0,0],
   [1,0,1,1,0,1,1,1,0,1,1],
   [0,1,0,1,1,0,0,0,0,0,0],
   [0,1,0,0,0,0,0,0,1,0,0],
   [0,1,0,0,1,0,0,0,1,0,0],
   [0,0,1,0,1,0,0,1,1,1,0],
   [1,0,1,0,1,0,0,0,0,0,0],
   [1,1,0,0,0,0,0,0,0,0,0],
   [0,0,0,1,0,0,1,0,0,0,0],
   [1,0,0,0,1,1,0,0,0,0,0]]

solution = [["X" if j else 0 for j in i] for i in grid]
solution[0][0] = 1

cells = [(0, 0)]
steps = 2

while cells:
    print("starting", cells)
    ncells = []
    for cell in cells:
        r, c = cell
        adjacent = [
            (r + 1, c),  # down
            (r - 1, c),  # up
            (r, c + 1),  # right
            (r, c - 1)   # left
        ]
        for nr, nc in adjacent:
            if 0 <= nr < len(grid) and 0 <= nc < len(grid[0]):
                if not grid[nr][nc] and not solution[nr][nc]:
                    solution[nr][nc] = steps
                    ncells.append((nr, nc))
    cells = list(set(ncells))
    steps += 1

for i in solution:
    print(" ".join(map(lambda x: str(x).rjust(2), i)))
