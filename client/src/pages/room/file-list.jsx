import { ListGroup, Button, ProgressBar } from 'react-bootstrap';
import { FaDownload } from 'react-icons/fa';
import { saveAs } from 'file-saver';
import { FileIcon } from 'react-file-icon';
import mimeTypes from 'mime-types';

function FileList({ files = [], download = false }) {
  return (
    <>
      {files.length ? (
        <ListGroup 
          size="sm"
          className=""
          variant="flush"
        >
          {files.map(item => (
            <ListGroup.Item
              key={item.name}
            >
              <div className="d-flex justify-content-between align-items-center gap-3 mb-2">
                <div
                  className="d-flex justify-content-start align-items-center gap-3"
                >
                  <div
                    style={{
                      width: 20
                    }}
                  >
                    <FileIcon
                      extension={mimeTypes.extension(item.type)}
                    />
                  </div>
                  <span>
                    {`${item.name} (${item.percentage}%)`}
                  </span>
                </div>
                {(item.percentage === 100 && download) ? (
                <Button
                  size="sm"
                  variant="link"
                  onClick={() => saveAs(
                    item.url,
                    item.name
                  )}
                >
                  <FaDownload />
                </Button>
                ) : null}
              </div>
              <ProgressBar 
                size="sm"
                variant={item.percentage === 100 ? 'success' : 'warning'}
                style={{
                  height: 5
                }}
                now={item.percentage} 
              />
            </ListGroup.Item>
          ))}
        </ListGroup>
      ) : (
        <div className="p-3 text-center">
          <p className="mb-0">No Files Yet</p>
        </div>
      )}
    </>
  );
}

export default FileList;