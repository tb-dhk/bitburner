from collections import deque, defaultdict

def two_color(n, edges):
    graph = defaultdict(list)
    for u, v in edges:
        graph[u].append(v)
        graph[v].append(u)

    color = [-1] * n  # -1 means unvisited

    for start in range(n):
        if color[start] != -1:
            continue
        queue = deque([start])
        color[start] = 0
        while queue:
            node = queue.popleft()
            for neighbor in graph[node]:
                if color[neighbor] == -1:
                    color[neighbor] = 1 - color[node]
                    queue.append(neighbor)
                elif color[neighbor] == color[node]:
                    return []  # Conflict → not bipartite
    return color

print(two_color(11,[[1,8],[0,6],[9,10],[5,6],[4,10],[2,5],[6,9],[5,6],[8,10],[2,3],[2,8],[4,6],[0,2],[1,7]]))
