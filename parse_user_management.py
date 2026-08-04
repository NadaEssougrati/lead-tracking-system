import pathlib
from pathlib import Path
import sys
from babel import parser as babel_parser

code = Path('src/components/UserManagement.tsx').read_text(encoding='utf-8')
try:
    babel_parser.parse(code, source_type='module', plugins=['typescript','jsx'])
    print('ok')
except Exception as e:
    print(type(e).__name__, e)
    if hasattr(e, 'loc') and e.loc:
        print('line', e.loc.line, 'column', e.loc.column)
        lines = code.splitlines()
        start = max(0, e.loc.line - 6)
        end = min(len(lines), e.loc.line + 5)
        for i, line in enumerate(lines[start:end], start):
            print(f'{i+1:04}: {line}')
    sys.exit(1)
