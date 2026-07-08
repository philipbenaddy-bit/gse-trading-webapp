import { useState, useEffect } from 'react';
import { MessageCircle, Send, Trash2, CornerDownRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Textarea } from '../ui/Input';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { Skeleton } from '../ui/Skeleton';
import { newsApi, Comment } from '../../lib/newsApi';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

interface CommentSectionProps {
  newsId: string;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ newsId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const { user } = useAuthStore();

  // Check if this is a cached news article (simple numeric ID vs UUID)
  const isCachedNews = /^\d+$/.test(newsId);

  useEffect(() => {
    // Skip API calls for cached news articles
    if (!isCachedNews) {
      fetchComments();
    } else {
      setLoading(false);
      setComments([]);
    }
  }, [newsId, isCachedNews]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await newsApi.getComments(newsId);
      setComments(response.data.data);
    } catch (error: any) {
      console.error('Failed to fetch comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    // Prevent comments on cached news articles
    if (isCachedNews) {
      toast.error('Comments are not available for this article yet');
      return;
    }

    try {
      setSubmitting(true);
      await newsApi.createComment(newsId, { content: newComment });
      setNewComment('');
      toast.success('Comment posted');
      fetchComments();
    } catch (error: any) {
      console.error('Failed to post comment:', error);
      toast.error(error.response?.data?.message || 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim()) return;

    // Prevent replies on cached news articles
    if (isCachedNews) {
      toast.error('Comments are not available for this article yet');
      return;
    }

    try {
      setSubmitting(true);
      await newsApi.createComment(newsId, { content: replyContent, parentId });
      setReplyContent('');
      setReplyingTo(null);
      toast.success('Reply posted');
      fetchComments();
    } catch (error: any) {
      console.error('Failed to post reply:', error);
      toast.error(error.response?.data?.message || 'Failed to post reply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      await newsApi.deleteComment(commentId);
      toast.success('Comment deleted');
      fetchComments();
    } catch (error: any) {
      console.error('Failed to delete comment:', error);
      toast.error(error.response?.data?.message || 'Failed to delete comment');
    }
  };

  const topLevelComments = comments.filter((c) => !c.parentId);

  return (
    <Card variant="bordered">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle size={20} />
          Comments ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {user && (
          <div className="space-y-3">
            <div className="flex gap-3">
              <Avatar fallback={user.name || user.email} size="md" />
              <div className="flex-1">
                <Textarea
                  placeholder="Share your thoughts..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                onClick={handleSubmitComment}
                isLoading={submitting}
                disabled={!newComment.trim()}
                leftIcon={<Send size={16} />}
              >
                Post Comment
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton variant="circular" width={40} height={40} />
                <div className="flex-1 space-y-2">
                  <Skeleton variant="text" width="30%" />
                  <Skeleton variant="text" width="100%" />
                </div>
              </div>
            ))}
          </div>
        ) : topLevelComments.length > 0 ? (
          <div className="space-y-6">
            {topLevelComments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                allComments={comments}
                onReply={setReplyingTo}
                onDelete={handleDeleteComment}
                replyingTo={replyingTo}
                replyContent={replyContent}
                setReplyContent={setReplyContent}
                onSubmitReply={handleSubmitReply}
                submitting={submitting}
                currentUserId={user?.id}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No comments yet. Be the first to share your thoughts!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface CommentItemProps {
  comment: Comment;
  allComments: Comment[];
  onReply: (id: string) => void;
  onDelete: (id: string) => void;
  replyingTo: string | null;
  replyContent: string;
  setReplyContent: (content: string) => void;
  onSubmitReply: (parentId: string) => void;
  submitting: boolean;
  currentUserId?: string;
  isReply?: boolean;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  allComments,
  onReply,
  onDelete,
  replyingTo,
  replyContent,
  setReplyContent,
  onSubmitReply,
  submitting,
  currentUserId,
  isReply = false,
}) => {
  const { user } = useAuthStore();
  const replies = allComments.filter((c) => c.parentId === comment.id);
  const isOwner = currentUserId === comment.userId;

  return (
    <div className={isReply ? 'ml-12' : ''}>
      <div className="flex gap-3">
        <Avatar fallback="U" size="md" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">User {comment.userId.slice(0, 8)}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </span>
          </div>
          <p className="text-gray-700 dark:text-gray-300 text-sm">{comment.content}</p>
          <div className="flex items-center gap-4">
            {user && (
              <button
                onClick={() => onReply(comment.id)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <CornerDownRight size={12} />
                Reply
              </button>
            )}
            {isOwner && (
              <button
                onClick={() => onDelete(comment.id)}
                className="text-xs text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
              >
                <Trash2 size={12} />
                Delete
              </button>
            )}
          </div>

          {replyingTo === comment.id && (
            <div className="mt-3 space-y-2">
              <Textarea
                placeholder="Write a reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                rows={2}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => onSubmitReply(comment.id)} isLoading={submitting} disabled={!replyContent.trim()}>
                  Reply
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { onReply(''); setReplyContent(''); }}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {replies.length > 0 && (
            <div className="mt-4 space-y-4">
              {replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  allComments={allComments}
                  onReply={onReply}
                  onDelete={onDelete}
                  replyingTo={replyingTo}
                  replyContent={replyContent}
                  setReplyContent={setReplyContent}
                  onSubmitReply={onSubmitReply}
                  submitting={submitting}
                  currentUserId={currentUserId}
                  isReply={true}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
