import { useState } from 'react';
import type { MouseEvent, ReactNode } from 'react';
import { Controlled as ControlledZoom } from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';
import Icon from '@plone/volto/components/theme/Icon/Icon';
import zoomInSVG from '@plone/volto/icons/zoom-in.svg';

type ImageZoomProps = {
  children: ReactNode;
  hasLink?: boolean;
};

const ImageZoom = ({ children, hasLink = false }: ImageZoomProps) => {
  const [isZoomed, setIsZoomed] = useState(false);

  const openZoom = (e: MouseEvent<HTMLButtonElement>) => {
    // Prevent a surrounding link (href) from being followed and stop the
    // click from reaching the image underneath.
    e.preventDefault();
    e.stopPropagation();
    setIsZoomed(true);
  };

  return (
    <div className={`image-zoom-wrapper${hasLink ? ' has-link' : ''}`}>
      <ControlledZoom
        isZoomed={isZoomed}
        onZoomChange={setIsZoomed}
        isDisabled={!isZoomed}
      >
        {children}
      </ControlledZoom>
      <button
        type="button"
        className="image-zoom-button"
        aria-label="Zoom image"
        onClick={openZoom}
      >
        <Icon name={zoomInSVG} size="24px" />
      </button>
    </div>
  );
};

export default ImageZoom;
