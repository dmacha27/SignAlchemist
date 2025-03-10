import { useState } from 'react';


import { Button, Form, Collapse, Modal } from 'react-bootstrap';
import "bootstrap-icons/font/bootstrap-icons.css";

const InfoModal = ({ show, onHide }) => (
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
                <strong>4. Output:</strong> The function's output will be the processed (filtered) signal values.
              </li>
              <li>
                <strong>5. No additional parameters:</strong> The function should not accept any additional parameters.
              </li>
              <li>
                <strong>6. Syntax Error:</strong> If there is a syntax error in the code, an error message will be displayed.
              </li>
              <li>
                <strong>7. Empty Field:</strong> If the field is left blank, the function will be executed with the other parameters from the form (this field will be ignored).
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Modal.Body>
    <Modal.Footer>
      <Button onClick={onHide}>Close</Button>
    </Modal.Footer>
  </Modal>
)


const FilterFields = ({ fields, onFieldChange }) => {
  const [open, setOpen] = useState(false);
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
              <Button
                className='mt-2'
                onClick={() => setOpen(!open)}
                aria-controls="example-collapse-text"
                aria-expanded={open}
              >
                Customize
              </Button>
              <Collapse in={open}>
                <Form.Group className="mb-3">
                  <Form.Label>Python code</Form.Label> <i onClick={() => { setModalShow(true) }} className="bi bi-info-square"></i>
                  <Form.Control as="textarea" value={fieldConfig.value} onChange={(e) => onFieldChange(field, e.target.value)} rows={3} />
                </Form.Group>
              </Collapse>
            </>
          );
        }


      })}
    </>
  );
};

export default FilterFields;
