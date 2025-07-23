def lz_encode(input_str):
    n = len(input_str)
    # We alternate between literal (type 1) and reference (type 2)
    # Start with type 1 (literal)
    encoded = []
    pos = 0
    chunk_type = 1  # 1 = literal, 2 = reference

    # Helper to find longest match for reference chunk
    def find_longest_match(pos):
        max_len = 0
        offset = 0
        max_offset = min(9, pos)  # offsets 1 to 9 allowed

        for off in range(1, max_offset+1):
            length = 0
            while (length < 9 and pos + length < n and
                   input_str[pos + length] == input_str[pos - off + length]):
                length += 1
            if length > max_len:
                max_len = length
                offset = off
        return max_len, offset

    while pos < n:
        if chunk_type == 1:
            # literal chunk
            # max length 9 or until next chunk
            length = min(9, n - pos)
            # To avoid next chunk being zero-length, never output zero length
            encoded.append(str(length))
            encoded.append(input_str[pos:pos+length])
            pos += length
            chunk_type = 2
        else:
            # reference chunk
            max_len, offset = find_longest_match(pos)
            if max_len <= 1:
                # no good match, output zero-length chunk (end of chunk)
                encoded.append('0')
                chunk_type = 1
            else:
                encoded.append(str(max_len))
                encoded.append(str(offset))
                pos += max_len
                chunk_type = 1

    return ''.join(encoded)

input_str = "0uE0uE0uE06Sebhxe8Sebhxe8SsjNOe8SsjNOe8b0lV1ZNY1ZNY1ZsDLBH"
encoded = lz_encode(input_str)
print(encoded)
print(f"Length of input: {len(input_str)}")
print(f"Length of encoded output: {len(encoded)}")
