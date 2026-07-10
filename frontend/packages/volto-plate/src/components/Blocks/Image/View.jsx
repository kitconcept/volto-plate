import UniversalLink from '@plone/volto/components/manage/UniversalLink/UniversalLink';
import Caption from '../Caption/Caption';
import { withBlockExtensions } from '@plone/volto/helpers/Extensions';
import config from '@plone/volto/registry';
import ImageZoom from './ImageZoom';

export const ImageView = ({ data }) => {
  let href;
  if (data.href?.length > 0) {
    if (typeof data.href === 'object') {
      href = data.href[0]['@id'];
    } else if (typeof data.href === 'string') {
      // just to catch cases where a string might be supplied
      href = data.href;
    }
  }

  const Image = config.getComponent({ name: 'Image' }).component;
  const shouldRenderCaption =
    data.title ||
    data.description ||
    (data?.copyright_and_sources ?? data.credit?.data);

  return (
    <>
      {data.url && (
        <>
          {(() => {
            const image = (
              <figure>
                <ImageZoom hasLink={data.href ? true : false}>
                  <Image
                    item={
                      data.image_scales
                        ? {
                            '@id': data.url,
                            image_field: data.image_field,
                            image_scales: data.image_scales,
                          }
                        : undefined
                    }
                    src={data.image_scales ? undefined : data.url}
                    sizes={config.blocks.blocksConfig.image.getSizes(data)}
                    alt={data.alt || ''}
                    loading="lazy"
                    responsive={true}
                  />
                </ImageZoom>
                {shouldRenderCaption && (
                  <Caption
                    title={data.title}
                    description={data.description}
                    credit={data?.copyright_and_sources ?? data.credit?.data}
                  />
                )}
              </figure>
            );
            if (href) {
              return (
                <UniversalLink
                  href={href}
                  openLinkInNewTab={data.openLinkInNewTab}
                >
                  {image}
                </UniversalLink>
              );
            } else {
              return image;
            }
          })()}
        </>
      )}
    </>
  );
};

export default withBlockExtensions(ImageView);
