# Blog AI Node JS




### Notes:
- The files in ./public directory are for testing purposes only.


### How to use API:

- You need to create a .env file with these:
	<br>PORT=your_port
	<br>JWT_SECRET=your_jwt_secret
	<br>OPENAI_API_KEY=your_openai_key
	<br>STRIPE_PUBLISHABLE_KEY=your_stripe_pk
	<br>STRIPE_SECRET_KEY=your_stripe_sk<br>


- I recommand the PORT 3000.
- For the JWT_SECRET you can generate one by running this: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
- If you don't have money to afford OPEN_API_KEY you can run one in local with github.com/PawanOsman/ChatGPT


### Docs:

- If you need to know something about the API there is a Swagger at localhost:your_port/api-docs/
- If you don't understand something in the Swagger, wait for proper documentation
- If you really don't understand something you can contact me at theogilat@gmail.com