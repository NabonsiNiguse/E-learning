import subprocess, sys, os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
result = subprocess.run(
    [sys.executable, 'manage.py', 'check'],
    capture_output=True, text=True
)
out = result.stdout + result.stderr
# Write to file so we can read it
with open('check_output.txt', 'w') as f:
    f.write(out)
print("RC:", result.returncode)
print(out[:3000])
