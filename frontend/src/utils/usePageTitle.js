import { useEffect } from 'react';

const usePageTitle = (title, section = null) => {
  useEffect(() => {
    let pageTitle = 'NexusChat';
    
    if (title) {
      pageTitle = `NexusChat | ${title}`;
    }
    
    if (section) {
      pageTitle = `NexusChat | ${title} | ${section}`;
    }
    
    document.title = pageTitle;
  }, [title, section]);
};

export default usePageTitle; 