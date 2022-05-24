const express = require("express");
const { v4: uuidv4 } = require("uuid");

const app = express();

const customers = [];

//Middleware
function verifyIsExistsAccountCPF(request, response, next) {
	const { cpf } = request.headers;

	const customer = customers.find((customer) => customer.cpf == cpf);

	if (!customer) {
		return response.status(400).json({ error: "Customer not found" });
	}

	request.customer = customer;

	return next();
}

function getBalance(statement) {
	const balance = statement.reduce((acc, operator) => {
		if (operator.type === "credit") {
			return acc + operator.amount;
		} else {
			return acc - operator.amount;
		}
	}, 0);

	return balance;
}

app.use(express.json());

app.post("/account", (request, response) => {
	const { cpf, name } = request.body;

	const customerAlreadyExists = customers.some(
		(customer) => customer.cpf === cpf,
	);

	if (customerAlreadyExists) {
		return response.status(400).json({ error: "Customer already exists" });
	}

	customers.push({
		cpf,
		name,
		id: uuidv4(),
		statement: [],
	});

	return response.status(201).send();
});

app.get("/statement", verifyIsExistsAccountCPF, (request, response) => {
	const { customer } = request;

	return response.json(customer.statement);
});

app.post("/deposit", verifyIsExistsAccountCPF, (request, response) => {
	const { description, amount } = request.body;

	const { customer } = request;

	const statementOperation = {
		description,
		amount,
		create_at: new Date(),
		type: "credit",
	};

	customer.statement.push(statementOperation);

	return response.status(201).send();
});

app.post("/withdraw", verifyIsExistsAccountCPF, (request, response) => {
	const { amount } = request.body;
	const { customer } = request;

	const balance = getBalance(customer.statement);

	if (balance < amount) {
		return response.status(400).json({ error: "Insufficient funds!" });
	}

	const statementOperation = {
		amount,
		create_at: new Date(),
		type: "debit",
	};

	customer.statement.push(statementOperation);

	return response.status(201).send();
});

app.listen(3333);
