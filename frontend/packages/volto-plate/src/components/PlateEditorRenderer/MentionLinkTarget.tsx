import React from 'react';

const HIGHLIGHT_DURATION = 3000;

const MentionLinkTarget = () => {
  React.useEffect(() => {
    const mentionId = new URLSearchParams(window.location.search).get(
      'plateMention',
    );
    if (!mentionId) return;

    const element = document.getElementById(`plate-mention-${mentionId}`);
    if (!element) return;

    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    element.classList.add('ring-2', 'ring-primary');

    const timer = window.setTimeout(() => {
      element.classList.remove('ring-2', 'ring-primary');
    }, HIGHLIGHT_DURATION);

    return () => window.clearTimeout(timer);
  }, []);

  return null;
};

export default MentionLinkTarget;
