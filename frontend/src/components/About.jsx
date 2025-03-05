import { Link } from 'react-router-dom';

const About = () => {
  return (
    <div className="container my-5">
      <h2 className="text-center">Acerca de nosotros</h2>
      <p>
        Esta página describe lo que hacemos. Aquí puedes explicar tu producto
        o servicio en detalle.
      </p>
      <Link to="/" className="btn btn-primary">Volver a la página principal</Link>
    </div>
  );
};

export default About;
