.PHONY: start stop build migrate migrate-generate

start:
	docker-compose up

stop:
	docker-compose down

build:
	docker-compose build

# Database migrations
migrate:
	cd backend && alembic upgrade head

migrate-generate:
	@read -p "Enter migration message: " msg; \
	cd backend && alembic revision --autogenerate -m "$$msg"
