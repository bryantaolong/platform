import { useRef } from 'react';
import PersonalizedFeed from '@/components/post/PersonalizedFeed';
import './RecommendFeed.css';

const RecommendFeed: React.FC = () => {
  const feedRef = useRef<(() => void) | null>(null);

  return (
    <div className="recommend-feed-page">
      <PersonalizedFeed refreshRef={feedRef} />
    </div>
  );
};

export default RecommendFeed;
