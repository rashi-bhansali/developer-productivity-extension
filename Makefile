.PHONY: install
install:
	@echo "🔧 Installing dependencies"
	@npm install
	@npx playwright install chromium

.PHONY: install-backend
install-backend:
	@echo "🔧 Installing backend dependencies"
	@python3 -m venv backend/.venv
	@backend/.venv/bin/pip3 install -r backend/requirements.txt

.PHONY: run-backend
run-backend:
	@echo "🚀 Starting backend on http://127.0.0.1:8000"
	@cd backend && .venv/bin/python -m uvicorn app.main:app --reload

.PHONY: backend-check
backend-check:
	@echo "🧪 backend compile check"
	@python3 -m compileall backend/app

.PHONY: test-code-quality
test-code-quality:
	@echo "🧪 Checking code quality"
	@npx eslint

.PHONY: test-unit
test-unit:
	@echo "🧪 unit tests"
	@npx jest tests/unit --verbose --coverage

.PHONY: test-e2e
test-e2e:
	@echo "🧪 e2e tests"
	@npx playwright test --project=e2e

.PHONY: test-performance
test-performance:
	@echo "🏊‍♂️ performance tests"
	@npx playwright test --project=performance
