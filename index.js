const { Pool } = require('pg');
const express = require('express');
const Ajv = require('ajv');
const dotenv = require('dotenv')

const app = express();
app.use(express.json());
const ajv = Ajv({ allErrors: true });
dotenv.config()

// db config
const pool = new Pool({
  host: process.env.HOST,
  database: process.env.DATABASE,
  user: process.env.USER,
  password: process.env.PASSWORD,
  port: process.env.PORT,
  max: process.env.MAX,
  idleTimeoutMillis: process.env.IDLETIMEOUTMILLIS,
  connectionTimeoutMillis: process.env.CONNECTIONTIMEOUTMILLIS,
});

// validation sheme
const postCategorySheme = {
  properties: {
    "category_name": { "type": "string", "maxLength": 128 },
  }
}

const putCategorySheme = {
  properties: {
    "category_name": { "type": "string", "maxLength": 128 },
    "id": { "type": "integer", minimum: 1 }
  }
}

const postProductSheme = {
  properties: {
    "product_name": { "type": "string", "maxLength": 128 },
    "category_id": { "type": "integer", minimum: 1 },
    "price": { "type": ["integer", "null"], minimum: 0 }
  }
}

const putProductSheme = {
  properties: {
    "product_name": { "type": "string", "maxLength": 128 },
    "category_id": { "type": "integer", minimum: 1 },
    "id": { "type": "integer", minimum: 1 }
  }
}

// API functions for categories
const getCategories = (request, response) => {
  pool.connect((error, client, release) => {
    client.query(
      'SELECT category_id, category_name FROM public.categories',
      (error, result) => {
        release();
        if (error) {
          console.error(error.stack);

          return response
            .status(500)
            .send({ message: 'Error when getting a categories' });
        }

        response.send(result.rows);
      }
    );

    if (error) {
      console.error(error);

      return response
        .status(500)
        .send({ message: 'Database connection error' });
    }
  });


};

const postCategory = (request, response) => {
  pool.connect((error, client) => {
    const { category_name } = request.body;

    if (!category_name) {
      return response
        .status(400)
        .send({ message: 'The request must contain the category_name!' });
    }

    var valid = ajv.validate(postCategorySheme, category_name);

    if (valid) {
      client.query('INSERT INTO public.categories (category_name) VALUES ($1)', [category_name],
        (error, results) => {
          if (error) {
            console.error(error.stack);

            return response
              .status(500)
              .send({ message: 'Error when creating a category' });
          }

          response.status(201).send(JSON.stringify({ "category_name": category_name }));
        });
    } else {
      console.error(ajv.errors);
      response.status(400).send('Enter the correct data');
    }

    if (error) {
      console.error(error);

      return response
        .status(500)
        .send({ message: 'Database connection error' });
    }
  });
};

const putCategory = (request, response) => {
  pool.connect((error, client) => {
    const id = parseInt(request.params.id);
    const { category_name } = request.body;

    if (!category_name) {
      return response
        .status(400)
        .send({ message: 'The request must contain the category_name!' });
    }
    var valid = ajv.validate(putCategorySheme, { category_name, id });

    if (valid) {
      client.query(
        'UPDATE public.categories SET category_name = $1 WHERE category_id = $2',
        [category_name, id],
        (error, results) => {
          if (error) {
            console.error(error.stack);
            return response
              .status(500)
              .send({ message: 'Error when changing the category' });
          }

          response.status(200).send(JSON.stringify({ "category_id": id, "category_name": category_name }));
        },
      );
    } else {
      console.error(ajv.errors);
      response.status(400).send('Enter the correct data');
    }

    if (error) {
      console.error(error);

      return response
        .status(500)
        .send({ message: 'Database connection error' });
    }
  });
};

const deleteCategory = (request, response, next) => {
  pool.connect((error, client) => {
    const id = parseInt(request.params.id);

    client.query('DELETE FROM public.categories WHERE category_id = $1', [id],
      (error, results) => {
        if (error) {
          console.error(error.stack);

          return response
            .status(500)
            .send({ message: 'Error when deleting the category' });
        }
        response.status(200).send(JSON.stringify({ "category_id": id }));
      });

    if (error) {
      console.error(error);

      return response
        .status(500)
        .send({ message: 'Database connection error' });
    }
  });
};

// API functions for goods
const getGoods = (request, response) => {
  pool.connect((error, client, release) => {
    client.query(
      'SELECT product_id, product_name, category_name, price FROM public.goods, \
      public.categories WHERE public.goods.category_id = public.categories.category_id',
      (error, result) => {
        release();
        if (error) {
          console.error(error.stack);

          return response
            .status(500)
            .send({ message: 'Error executing query' });
        }

        response.send(result.rows);
      },
    );
    if (error) {
      console.error(error);

      return response
        .status(500)
        .send({ message: 'Database connection error' });
    }
  });
};

const postGood = (request, response) => {
  pool.connect((error, client) => {
    const { category_id, product_name, price } = request.body;

    if (!product_name || !category_id) {
      return response
        .status(400)
        .send({ message: 'The request must contain the product_name or the category_id!' });
    }

    var valid = ajv.validate(postProductSheme, { category_id, product_name, price });

    if (valid) {
      client.query('INSERT INTO public.goods (category_id, product_name, price) VALUES ($1, $2, $3)', [category_id, product_name, price],
        (error, results) => {
          if (error) {
            console.error(error.stack);

            return response
              .status(500)
              .send({ message: 'Error when creating a product' });
          }
          response.status(201).send(JSON.stringify({ "product_name": product_name }));
        });
    } else {
      console.error(ajv.errors);
      response.status(400).send('Enter the correct data');
    }

    if (error) {
      console.error(error);

      return response
        .status(500)
        .send({ message: 'Database connection error' });
    }
  });
};

const putGood = (request, response) => {
  pool.connect((error, client) => {
    const id = parseInt(request.params.id);
    const { product_name } = request.body;

    if (!product_name) {
      return response
        .status(400)
        .send({ message: 'The request must contain the category_name!' });
    }

    var valid = ajv.validate(putProductSheme, { product_name, id });
    if (valid) {
      client.query(
        'UPDATE public.goods SET product_name = $1 WHERE product_id = $2',
        [product_name, id],
        (error, results) => {
          if (error) {
            console.error(error.stack);

            return response
              .status(500)
              .send({ message: 'Error when changing the product' });
          }

          response.status(200).send(JSON.stringify({ "product_id": id, "product_name": product_name }));
        },
      );
    } else {
      console.error(ajv.errors);
      response.status(400).send('Enter the correct data');
    }

    if (error) {
      console.error(error);

      return response
        .status(500)
        .send({ message: 'Database connection error' });
    }
  });
};

const deleteGood = (request, response, next) => {
  pool.connect((error, client) => {
    const id = parseInt(request.params.id);

    client.query('DELETE FROM public.goods WHERE product_id = $1', [id],
      (error, results) => {
        if (error) {
          console.error(error.stack);

          return response
            .status(500)
            .send({ message: 'Error when deleting the product' });
        }

        response.status(200).send(JSON.stringify({ "product_id": id }));
      });

    if (error) {
      console.error(error);

      return response
        .status(500)
        .send({ message: 'Database connection error' });
    }
  });
};

// routes
app.get('/api/categories/', getCategories);
app.post('/api/categories/', postCategory);
app.put('/api/categories/:id', putCategory);
app.delete('/api/categories/:id', deleteCategory);

app.get('/api/goods/', getGoods);
app.post('/api/goods/', postGood);
app.put('/api/goods/:id', putGood);
app.delete('/api/goods/:id', deleteGood);

app.listen(3000);
