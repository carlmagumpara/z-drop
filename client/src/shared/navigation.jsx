import { Container, Nav, Navbar, NavDropdown, Image } from 'react-bootstrap';
import { Link } from 'react-router';
import Avatar from 'boring-avatars';
import Logo from '@/assets/logo.png'
import { usePresence } from '@/contexts/presence';
import { useGlobalModal, MODAL_TYPES } from '@/contexts/global-modal';

function Navigation() {
  const { handleShow } = useGlobalModal();
  const { username } = usePresence();

  return (
    <Navbar
      expand="lg"
      fixed="top"
      // className="border-bottom"
    >
      <Container
        fluid
      >
        <Navbar.Brand 
          as={Link} 
          to={`/`} 
          className="cursor-pointer"
        >
          <Image 
            className="" 
            src={Logo}
            alt="lexmeet"
            style={{
              width: 40
            }}
          />
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <NavDropdown 
              title={
                <>
                  <Avatar 
                    name={username ?? ''}
                    size={30}
                    variant="beam"
                  />
                  <span className="ms-2">{username}</span>
                </>
              }
              align="end"
            >
              <NavDropdown.Item
                onClick={() => handleShow(MODAL_TYPES.SETTINGS)}
              >
                Settings
              </NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default Navigation;