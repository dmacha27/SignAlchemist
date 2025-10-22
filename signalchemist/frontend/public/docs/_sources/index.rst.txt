.. image:: _static/logo.png
   :alt: SignAlchemist logo
   :width: 200px
   :align: center


Welcome to SignAlchemist!
=========================

SignAlchemist is an open-source web application designed to make physiological signal processing easy; nonetheless, any other signal can be processed.

Its main aim is to be accessible to practitioners and researchers everywhere, providing a simple graphical user interface based on nodes for novice users, and more complex functionality for people with Python programming knowledge.

The application has been designed with up-to-date web-based frameworks that make it responsive and easy to use on any device.

✨ Features (more to come!)
---------------------------

- **Resampling**: changes the sampling rate of the signal by using several interpolation techniques such as spline or interp1d. This is useful when signals come from different sources or when they need to be normalized to a common frequency.

- **Filtering**: removes artefacts (e.g., noise, high-frequency...) using different filters including Butterworth, Bessel, FIR, and Savitzky-Golay. Parameters such as cutoff frequencies can be set based on user needs. Furthermore, users can create and customize their own filters using Python by following the instructions on the page.

- **Outlier detection**: identifies and removes unusual data that deviate significantly from the expected signal pattern. Techniques available include the Hampel filter and IQR-based detection, aiming to improve signal quality without affecting legitimate variations.


.. toctree::
   :maxdepth: 2
   :caption: Contents:

   installation
   usage
   core_widgets
   home
   resampling
   filtering
   processing
