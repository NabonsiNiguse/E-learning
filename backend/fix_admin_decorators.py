import re, os

base = os.path.dirname(os.path.abspath(__file__))

files = [
    'users/admin.py',
    'courses/admin.py',
    'enrollments/admin.py',
    'payments/admin.py',
    'notifications/admin.py',
    'attendance/admin.py',
    'grading/admin.py',
    'progress/admin.py',
]

for f in files:
    path = os.path.join(base, f)
    with open(path, encoding='utf-8') as fh:
        content = fh.read()
    new = re.sub(r'@admin\.register\([^)]+\)\n', '', content)
    with open(path, 'w', encoding='utf-8') as fh:
        fh.write(new)
    print(f'Cleaned {f}')
