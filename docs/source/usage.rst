Usage
=====

Accessing the Application
-------------------------

Once the containers are running, open your web browser and navigate to:

.. code-block:: none

   http://localhost:<FRONTEND_PORT>

Replace ``<FRONTEND_PORT>`` with the actual port number defined in your environment file.

Main navigation
---------------

The current interface includes the following main entry points:

- A Home page for loading the dataset
- An About page with project context and quick links
- A floating workspace navigation menu for tool pages
- Theme and language controls
- A footer link to the in-app documentation

Recommended Workflow
--------------------

For most users, the usual workflow is:

1. Load and validate a CSV from Home.
2. Choose either a focused utility or the Processing workspace.
3. Export a pipeline if you need repeatable execution.
4. Use Batch when you want to replay that pipeline over many files.

Documentation Access
--------------------

The bundled documentation is served inside the frontend under:

.. code-block:: none

   /docs/index.html
