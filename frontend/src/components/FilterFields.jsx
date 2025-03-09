import { useState } from 'react';

import { Button, Form, Collapse } from 'react-bootstrap';

const FilterFields = ({ fields, onFieldChange }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
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
                click
              </Button>
              <Collapse in={open}>
                <Form.Group className="mb-3">
                  <Form.Label>Python code</Form.Label>
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
