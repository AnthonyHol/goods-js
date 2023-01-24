const { Pool } = require('pg');
const express = require('express');

const app = express();
app.use(express.json());

// db config
const pool = new Pool({
  host: 'localhost',
  database: 'test_db',
  user: 'postgres',
  password: 'admin',
  port: 5432,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// API functions for categories
const getCategories = (request, response) => {
  pool.connect((error, client, release) => {
    client.query(
      'SELECT category_id, category_name FROM public.categories',
      (error, result) => {
        release();
        if (error) {
          return response
            .status(500)
            .send({ message: 'Error executing query', stack: error.stack });
        }
        response.send(result.rows);
      },
    );
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

    client.query('INSERT INTO public.categories (category_name) VALUES ($1)', [category_name],
      (error, results) => {
        if (error) {
          return response
            .status(500)
            .send({ message: 'Error when creating a category', stack: error.stack });
        }
        response.status(201).send(JSON.stringify({ "category_name": category_name }));
      });
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

    client.query(
      'UPDATE public.categories SET category_name = $1 WHERE category_id = $2',
      [category_name, id],
      (error, results) => {
        if (error) {
          return response
            .status(500)
            .send({ message: 'Error when changing the category', stack: error.stack });
        }
        response.status(200).send(`The category was modified with ID: ${id}`);
      },
    );
  });
};

const deleteCategory = (request, response, next) => {
  pool.connect((error, client) => {
    const id = parseInt(request.params.id);

    client.query('DELETE FROM public.categories WHERE category_id = $1', [id],
      (error, results) => {
        if (error) {
          return response
            .status(500)
            .send({ message: 'Error when deleting the category', stack: error.stack });
        }
        response.status(204).send(`The category deleted with ID: ${id}`);
      });
  });
};

// API functions for goods
const getGoods = (request, response) => {
  pool.connect((error, client, release) => {
    client.query(
      'SELECT product_id, product_name,category_name,price FROM public.goods, \
      public.categories WHERE public.goods.category_id = public.categories.category_id',
      (error, result) => {
        release();
        if (error) {
          return response
            .status(500)
            .send({ message: 'Error executing query', stack: error.stack });
        }
        response.send(result.rows);
      },
    );
  });
};

const postGood = (request, response) => {
  pool.connect((error, client) => {
    const { category_id, product_name } = request.body;

    if (!product_name || !category_id) {
      return response
        .status(400)
        .send({ message: 'The request must contain the product_name or the category_id!' });
    }

    client.query('INSERT INTO public.goods (category_id, product_name) VALUES ($1, $2)', [category_id, product_name],
      (error, results) => {
        if (error) {
          return response
            .status(500)
            .send({ message: 'Error when creating a product', stack: error.stack });
        }
        response.status(201).send(JSON.stringify({ "product_name": product_name }));
      });
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

    client.query(
      'UPDATE public.goods SET product_name = $1 WHERE product_id = $2',
      [product_name, id],
      (error, results) => {
        if (error) {
          return response
            .status(500)
            .send({ message: 'Error when changing the product', stack: error.stack });
        }
        response.status(200).send(`The product was modified with ID: ${id}`);
      },
    );
  });
};

const deleteGood = (request, response, next) => {
  pool.connect((error, client) => {
    const id = parseInt(request.params.id);

    client.query('DELETE FROM public.goods WHERE product_id = $1', [id],
      (error, results) => {
        if (error) {
          return response
            .status(500)
            .send({ message: 'Error when deleting the product', stack: error.stack });
        }
        response.status(204).send(`The product deleted with ID: ${id}`);
      });
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
