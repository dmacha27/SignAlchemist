import { useState } from 'react';


import { Button, Form, Modal } from 'react-bootstrap';
import "bootstrap-icons/font/bootstrap-icons.css";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';

/**
 * InfoModal component displays a modal with Python function information and example code.
 * 
 * @param {Object} props
 * @param {boolean} props.show - Boolean that controls whether the modal is visible or not.
 * @param {function} props.onHide - Function to close the modal.
 */
const InfoModal = ({ show, onHide }) => {
  const content = 'def filter_signal(signal): \n\tnew_values = scipy.ndimage.gaussian_filter1d(signal, sigma=30) \n\treturn new_values';
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
  };

  return (
    <Modal {...{ show, onHide }} aria-labelledby="contained-modal-title-vcenter" centered>
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-vcenter">
          Python info
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="d-flex justify-content-center gap-3">
        <div className="container">
          <div className="row">
            <div className="col">
              <h2><strong>filter_signal</strong> function</h2>
              <ul className="instructions-list">
                <li>
                  <strong>1. Code:</strong> The code must be written in Python.
                </li>
                <li>
                  <strong>2. Function name:</strong> The code must contain the definition of a function named <code>filter_signal</code> that performs the filtering of the signal.
                </li>
                <li>
                  <strong>3. Parameters:</strong> The function must have a single parameter that represents the signal values.
                </li>
                <li>
                  <strong>4. Output:</strong> The function's output will be the processed (filtered) signal values (must have the same length as the input).
                </li>
                <li>
                  <strong>5. No additional parameters:</strong> The function should not accept any additional parameters.
                </li>
                <li>
                  <strong>6. Syntax Error:</strong> If there is a syntax error in the code, an error message will be displayed.
                </li>
                <li>
                  <strong>7. Empty Field:</strong> If the field is left blank, the filter will be executed with the other parameters from the form (this field will be ignored).
                </li>
                <li>
                  <strong>8. ¿What packages can i use? (more to come):</strong>
                  <SyntaxHighlighter language="python">
                    {'import numpy as np \nimport pandas as pd \nimport neurokit2 \nimport scipy'}
                  </SyntaxHighlighter>
                </li>
                <li>
                  <strong>Example (copy and paste to try!):</strong>
                  <div className="syntax-highlighter-container">
                    <SyntaxHighlighter language="python">
                      {content}
                    </SyntaxHighlighter>
                    <i className="bi bi-clipboard copy-icon text-dark" title="Copy" onClick={handleCopy}></i>
                  </div>

                </li>
              </ul>
            </div>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={onHide}>Close</Button>
      </Modal.Footer>
    </Modal>);
}

/**
 * FilterFields component renders form fields for different filter parameters and displays a modal for Python code information.
 * 
 * @param {Object} props
 * @param {Object} props.fields - An object containing the filter fields and their configuration.
 * @param {function} props.onFieldChange - A callback function to handle field value changes.
 */
const FilterFields = ({ fields, onFieldChange }) => {
  const [modalShow, setModalShow] = useState(false);

  return (
    <>
      <InfoModal
        show={modalShow}
        onHide={() => setModalShow(false)}
      />
      {Object.keys(fields).map((field) => {
        const fieldConfig = fields[field];

        if (field != "python") {
          return (
            <Form.Group key={field} className="form-group">
              <Form.Label>{field.charAt(0).toUpperCase() + field.slice(1)} Frequency</Form.Label>
              <Form.Control
                type="number"
                placeholder={`Enter ${field}`}
                value={fieldConfig.value}
                onChange={(e) => onFieldChange(field, Number(e.target.value))}
              />
            </Form.Group>
          );
        } else {
          return (
            <>
              <Form.Group className="mb-3">
                <Form.Label>Python code</Form.Label> <i onClick={() => { setModalShow(true) }} title="Info" className="bi bi-info-square info-icon"></i>
                <Form.Control as="textarea" value={fieldConfig.value} onChange={(e) => onFieldChange(field, e.target.value)} rows={3} />
              </Form.Group>
            </>
          );
        }


      })}
    </>
  );
};

export default FilterFields;
