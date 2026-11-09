import re

content = open("src/components/game/stage2/stage2TargetsConfig.ts", encoding="utf-8").read()
pattern = r"targetId:\s*'(.*?)'.*?svgPath:\s*'(.*?)'"
matches = re.findall(pattern, content, re.DOTALL)

for tid, path in matches:
    cmds = re.findall(r'[MLCZQ]', path)
    cmd_counts = {c: cmds.count(c) for c in set(cmds)}
    has_curves = 'C' in cmd_counts or 'Q' in cmd_counts
    print(f"{tid:<15}: length {len(path):<5} commands: {cmd_counts} has_curves: {has_curves}")

