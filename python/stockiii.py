k = 2
days = [187,132,2,143,53,174,116,153,53,164,144,125,46,156,110,143,90,8,11,50,109,145,46,75,22,21,62,162,18,183,142,47,199,86,174,123,30,83,161,140,44,118]

dp = [[0 for _ in days] for _ in range(k+1)]

for i in range(1, len(dp)):
    for d in range(len(dp[i])):
        dp[i][d] = max([dp[i][d-1]] + [days[d] - days[j] + dp[i-1][j] for j in range(d)])

for row in dp:
    print(row, max(row))
