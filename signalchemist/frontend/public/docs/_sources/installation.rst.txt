Installation
============

**SignAlchemist** uses Docker containers to simplify both development and deployment. The same repository also contains the Sphinx documentation source used for Read the Docs and for the in-app documentation bundle.

Environment Files
-----------------

The repository uses three environment files:

- ``.env`` as the fallback default
- ``.env.dev`` for development
- ``.env.prod`` for production

The main values are:

- ``VITE_BACKEND_PORT``
- ``FRONTEND_PORT``
- ``PYTHON_ENABLED``

Development Mode
----------------

To run the development stack:

.. code-block:: bash

   docker compose -f signalchemist/docker-compose.dev.yml --env-file signalchemist/.env.dev up --build

This starts the frontend and backend in development mode.

Production Mode
---------------

To build the production stack:

.. code-block:: bash

   docker compose -f signalchemist/docker-compose.prod.yml --env-file signalchemist/.env.prod up --build -d

In production, the frontend is built as static files and served behind Nginx.

How the Docs Are Served
-----------------------

The documentation source files live in:

.. code-block:: none

   docs/source

The generated HTML is written to:

.. code-block:: none

   docs/build/html

The frontend serves the bundled documentation from:

.. code-block:: none

   signalchemist/frontend/public/docs

During the production frontend build, ``Dockerfile.prod`` copies ``public/docs`` into ``dist/docs`` so the documentation becomes available from ``/docs/index.html``.

Updating Bundled Documentation
------------------------------

After editing the Sphinx files, rebuild and sync them into the frontend:

.. code-block:: bash

   python -m pip install -r docs/requirements.txt
   python -m sphinx -b html docs/source docs/build/html

Then copy the generated HTML into the frontend:

.. code-block:: bash

   rm -rf signalchemist/frontend/public/docs
   cp -r docs/build/html signalchemist/frontend/public/docs

The important point is that ``signalchemist/frontend/public/docs`` should always contain the latest built HTML before shipping the frontend.

Read the Docs Hosting
---------------------

The repository already contains ``.readthedocs.yml`` pointing at ``docs/source/conf.py``. That means the same source can be used both for hosted documentation and for the bundled in-app documentation.
