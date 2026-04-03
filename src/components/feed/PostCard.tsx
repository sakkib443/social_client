'use client';

import { useState } from 'react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, Trash2, Globe, Lock, MoreVertical, Bookmark, Bell, Edit, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Avatar, Modal } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { postService } from '@/lib/posts';
import type { Post, User } from '@/types';
import { CommentSection } from './CommentSection';

interface PostCardProps {
  post: Post;
  onDelete?: (postId: string) => void;
  onLikeUpdate?: (postId: string, liked: boolean, likeCount: number) => void;
}

export function PostCard({ post, onDelete, onLikeUpdate }: PostCardProps) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(post.isLikedByMe);
  const [likeCount, setLikeCount] = useState(post._count.likes);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(post._count.comments);
  const [showLikersModal, setShowLikersModal] = useState(false);
  const [likers, setLikers] = useState<User[]>([]);
  const [loadingLikers, setLoadingLikers] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isAuthor = user?._id === post.author._id;
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });

  const handleLike = async () => {
    if (!user) {
      toast.error('Please login to like posts');
      return;
    }

    // Optimistic update
    const newLiked = !liked;
    const newCount = newLiked ? likeCount + 1 : likeCount - 1;
    setLiked(newLiked);
    setLikeCount(newCount);

    try {
      const result = await postService.toggleLike(post._id);
      setLiked(result.liked);
      setLikeCount(result.likeCount);
      onLikeUpdate?.(post._id, result.liked, result.likeCount);
    } catch (error: any) {
      // Rollback on error
      setLiked(!newLiked);
      setLikeCount(likeCount);
      toast.error(error.message || 'Failed to like post');
    }
  };

  const handleShowLikers = async () => {
    setShowLikersModal(true);
    setLoadingLikers(true);
    try {
      const result = await postService.getLikers(post._id);
      setLikers(result.users);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load likers');
    } finally {
      setLoadingLikers(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    setIsDeleting(true);
    try {
      await postService.deletePost(post._id);
      onDelete?.(post._id);
      toast.success('Post deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete post');
    } finally {
      setIsDeleting(false);
      setShowMenu(false);
    }
  };

  const handleCommentCountChange = (delta: number) => {
    setCommentCount((prev) => prev + delta);
  };

  return (
    <article className="_feed_inner_timeline_post_area _b_radious6 _padd_b24 _padd_t24 _mar_b16 animate-fadeIn">
      {/* Header */}
      <div className="_feed_inner_timeline_content _padd_r24 _padd_l24">
        <div className="_feed_inner_timeline_post_top">
          <div className="_feed_inner_timeline_post_box">
            <div className="_feed_inner_timeline_post_box_image">
              <Avatar
                src={post.author.avatar}
                name={`${post.author.firstName} ${post.author.lastName}`}
                size="md"
              />
            </div>
            <div className="_feed_inner_timeline_post_box_txt">
              <h4 className="_feed_inner_timeline_post_box_title">
                {post.author.firstName} {post.author.lastName}
              </h4>
              <p className="_feed_inner_timeline_post_box_para">
                {timeAgo} • {' '}
                {post.isPrivate ? (
                  <span className="inline-flex items-center gap-1">
                    <Lock size={12} /> Private
                  </span>
                ) : (
                  <a href="#" className="text-[var(--color5)]">Public</a>
                )}
              </p>
            </div>
          </div>

          {/* Menu */}
          <div className="_feed_inner_timeline_post_box_dropdown relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="_feed_timeline_post_dropdown_link"
            >
              <MoreVertical size={20} color="#C4C4C4" />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg py-2 min-w-[180px] z-50 animate-fadeIn">
                <ul className="_feed_timeline_dropdown_list">
                  <li className="_feed_timeline_dropdown_item">
                    <button className="_feed_timeline_dropdown_link w-full text-left">
                      <span><Bookmark size={18} className="text-[var(--color5)]" /></span>
                      Save Post
                    </button>
                  </li>
                  <li className="_feed_timeline_dropdown_item">
                    <button className="_feed_timeline_dropdown_link w-full text-left">
                      <span><Bell size={18} className="text-[var(--color5)]" /></span>
                      Turn On Notification
                    </button>
                  </li>
                  {isAuthor && (
                    <>
                      <li className="_feed_timeline_dropdown_item">
                        <button className="_feed_timeline_dropdown_link w-full text-left">
                          <span><Edit size={18} className="text-[var(--color5)]" /></span>
                          Edit Post
                        </button>
                      </li>
                      <li className="_feed_timeline_dropdown_item">
                        <button 
                          onClick={handleDelete}
                          disabled={isDeleting}
                          className="_feed_timeline_dropdown_link w-full text-left text-red-500"
                        >
                          <span><Trash2 size={18} /></span>
                          {isDeleting ? 'Deleting...' : 'Delete Post'}
                        </button>
                      </li>
                    </>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        {post.content && (
          <p className="_feed_inner_timeline_post_title whitespace-pre-wrap break-words">
            {post.content}
          </p>
        )}

        {/* Image */}
        {post.imageUrl && (
          <div className="_feed_inner_timeline_image">
            <Image
              src={post.imageUrl}
              alt="Post image"
              width={800}
              height={600}
              className="_time_img object-contain max-h-[500px]"
            />
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="_feed_inner_timeline_total_reacts _padd_r24 _padd_l24 _mar_b26">
        <div className="_feed_inner_timeline_total_reacts_image">
          {likeCount > 0 && (
            <>
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-500 text-white text-xs">❤️</span>
              <button
                onClick={handleShowLikers}
                className="_feed_inner_timeline_total_reacts_para hover:text-[var(--color5)] cursor-pointer"
              >
                {likeCount}
              </button>
            </>
          )}
        </div>
        <div className="_feed_inner_timeline_total_reacts_txt">
          <p className="_feed_inner_timeline_total_reacts_para1">
            <button
              onClick={() => setShowComments(!showComments)}
              className="hover:text-[var(--color5)]"
            >
              <span>{commentCount}</span> Comment{commentCount !== 1 ? 's' : ''}
            </button>
          </p>
          <p className="_feed_inner_timeline_total_reacts_para2">
            <span>0</span> Share
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="_feed_inner_timeline_reaction _padd_r24 _padd_l24">
        <button
          onClick={handleLike}
          className={`_feed_reaction ${liked ? '_feed_reaction_active' : ''}`}
        >
          <Heart size={20} fill={liked ? '#ef4444' : 'none'} color={liked ? '#ef4444' : 'currentColor'} />
          <span>{liked ? 'Liked' : 'Like'}</span>
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className={`_feed_reaction ${showComments ? '_feed_reaction_active' : ''}`}
        >
          <MessageCircle size={20} />
          <span>Comment</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <CommentSection
          postId={post._id}
          onCommentCountChange={handleCommentCountChange}
        />
      )}

      {/* Likers Modal */}
      <Modal
        isOpen={showLikersModal}
        onClose={() => setShowLikersModal(false)}
        title="Likes"
        size="sm"
      >
        <div className="p-4">
          {loadingLikers ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[var(--color5)]"></div>
            </div>
          ) : likers.length === 0 ? (
            <p className="text-center text-[var(--color7)] py-8">
              No likes yet
            </p>
          ) : (
            <div className="space-y-3">
              {likers.map((liker) => (
                <div key={liker._id} className="flex items-center gap-3">
                  <Avatar
                    src={liker.avatar}
                    name={`${liker.firstName} ${liker.lastName}`}
                    size="md"
                  />
                  <div>
                    <p className="font-medium text-[var(--color-text-primary)]">
                      {liker.firstName} {liker.lastName}
                    </p>
                    <p className="text-sm text-[var(--color-text-muted)]">
                      {liker.email}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </article>
  );
}
