k = 2
days = 45,73,185,63,144,58,40,54,55,93,92,199,82,17,76,146,53,11,8,165,1,20,78,125,80,154,18,163,101,60,172,144,126,152,92,179,19,2]

dp = [[0 for _ in days] for _ in range(k+1)]

for i in range(1, len(dp)):
    for d in range(len(dp[i])):
        dp[i][d] = max([dp[i][d-1]] + [days[d] - days[j] + dp[i-1][j] for j in range(d)])

for row in dp:
    print(row, max(row))
