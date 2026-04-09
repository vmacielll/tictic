#!/bin/bash
set -e

# Start servers
cd /Users/vmaciel/Projects/tictic/apps/server
npx tsx src/app.ts &
SERVER_PID=$!

cd /Users/vmaciel/Projects/tictic/apps/web
PORT=3000 npx next dev -p 3000 &
WEB_PID=$!

# Wait for servers to be ready
echo "Waiting for servers..."
for i in $(seq 1 20); do
  if curl -s http://localhost:3333/health > /dev/null 2>&1 && curl -s http://localhost:3000/register > /dev/null 2>&1; then
    echo "Servers ready!"
    break
  fi
  sleep 1
done

# Run Playwright
cd /Users/vmaciel/Projects/tictic/apps/e2e
npx playwright test "$@"
TEST_EXIT=$?

# Cleanup
kill $SERVER_PID 2>/dev/null || true
kill $WEB_PID 2>/dev/null || true

exit $TEST_EXIT
