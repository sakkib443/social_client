'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Navbar } from '@/components/layout/Navbar';
import { CreatePost, PostCard, PostCardSkeleton } from '@/components/feed';
import { useAuth } from '@/context/AuthContext';
import { postService } from '@/lib/posts';
import { friendService } from '@/lib/friends';
import { storyService, type StoryGroup, type StoryItem } from '@/lib/stories';
import { bookmarkService } from '@/lib/bookmarks';
import { uploadService } from '@/lib/upload';
import type { Post, User } from '@/types';
import type { FriendRequest } from '@/lib/friends';

type ActiveView = 'feed' | 'bookmarks' | 'friends' | 'settings';

export default function FeedPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Dynamic sidebar state
  const [activeView, setActiveView] = useState<ActiveView>('feed');
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Post[]>([]);
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [sendingRequest, setSendingRequest] = useState<Set<string>>(new Set());

  // Story viewer state
  const [viewingStory, setViewingStory] = useState<{ group: StoryGroup; index: number } | null>(null);

  // Story creation state
  const [showStoryCreate, setShowStoryCreate] = useState(false);
  const [storyUploading, setStoryUploading] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  const loadPosts = useCallback(async (pageNum: number, append = false) => {
    if (pageNum === 1) setIsLoading(true);
    else setIsLoadingMore(true);
    try {
      const result = await postService.getPosts(pageNum, 10);
      if (append) setPosts((prev) => [...prev, ...result.posts]);
      else setPosts(result.posts);
      setHasMore(result.hasMore);
      setPage(pageNum);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load posts');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  const loadSidebar = useCallback(async () => {
    try {
      const [sug, fri, req, stories] = await Promise.all([
        friendService.getSuggestions(),
        friendService.getFriends(),
        friendService.getPendingRequests(),
        storyService.getStories(),
      ]);
      setSuggestions(sug);
      setFriends(fri);
      setPendingRequests(req);
      setStoryGroups(stories);
    } catch {
      // Silently fail sidebar data
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadPosts(1);
      loadSidebar();
    }
  }, [isAuthenticated, loadPosts, loadSidebar]);

  const handlePostCreated = (newPost: Post) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  const handlePostDeleted = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p._id !== postId));
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) loadPosts(page + 1, true);
  };

  // Friend actions
  const handleSendRequest = async (userId: string) => {
    setSendingRequest((prev) => new Set(prev).add(userId));
    try {
      await friendService.sendRequest(userId);
      toast.success('Friend request sent!');
      setSuggestions((prev) => prev.filter((u) => u._id !== userId));
    } catch (error: any) {
      toast.error(error.message || 'Failed');
    } finally {
      setSendingRequest((prev) => { const n = new Set(prev); n.delete(userId); return n; });
    }
  };

  const handleAcceptRequest = async (requestId: string, senderName: string) => {
    try {
      await friendService.acceptRequest(requestId);
      toast.success(`${senderName} is now your friend!`);
      setPendingRequests((prev) => prev.filter((r) => r._id !== requestId));
      loadSidebar();
    } catch (error: any) {
      toast.error(error.message || 'Failed');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await friendService.rejectRequest(requestId);
      setPendingRequests((prev) => prev.filter((r) => r._id !== requestId));
    } catch (error: any) {
      toast.error(error.message || 'Failed');
    }
  };

  // Bookmarks
  const handleViewBookmarks = async () => {
    setActiveView('bookmarks');
    try {
      const bm = await bookmarkService.getBookmarks();
      setBookmarkedPosts(bm);
    } catch { /* ignore */ }
  };

  // Story creation
  const handleStoryImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Only images'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5MB'); return; }

    setStoryUploading(true);
    try {
      const uploaded = await uploadService.uploadImage(file);
      await storyService.createStory({ imageUrl: uploaded.url });
      toast.success('Story posted!');
      loadSidebar();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create story');
    } finally {
      setStoryUploading(false);
      setShowStoryCreate(false);
    }
  };

  if (authLoading) {
    return (
      <div className="_layout _layout_main_wrapper min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--color5)]"></div>
      </div>
    );
  }

  // Menu items
  const menuItems = [
    { icon: '🎓', label: 'Learning', badge: 'New', action: () => setActiveView('feed') },
    { icon: '📊', label: 'Insights', action: () => setActiveView('feed') },
    { icon: '👥', label: 'Find friends', action: () => setActiveView('friends') },
    { icon: '🔖', label: 'Bookmarks', action: () => handleViewBookmarks() },
    { icon: '👨‍👩‍👧‍👦', label: 'Group', action: () => setActiveView('feed') },
    { icon: '🎮', label: 'Gaming', badge: 'New', action: () => setActiveView('feed') },
    { icon: '⚙️', label: 'Settings', action: () => setActiveView('settings') },
    { icon: '💾', label: 'Save post', action: () => handleViewBookmarks() },
  ];

  // Render middle content based on active view
  const renderMiddleContent = () => {
    switch (activeView) {
      case 'bookmarks':
        return (
          <div>
            <div className="_feed_inner_area _b_radious6 _padd_t24 _padd_b24 _padd_r24 _padd_l24 _mar_b16">
              <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--color6)' }}>📑 Bookmarked Posts</h3>
              <button onClick={() => setActiveView('feed')} style={{ fontSize: 13, color: '#1890FF', cursor: 'pointer', background: 'none', border: 'none', marginTop: 4 }}>← Back to Feed</button>
            </div>
            {bookmarkedPosts.length === 0 ? (
              <div className="_feed_inner_area _b_radious6 _padd_t24 _padd_b24 _padd_r24 _padd_l24 text-center">
                <div className="text-6xl mb-4">🔖</div>
                <h3 className="text-xl font-semibold text-[var(--color6)] _mar_b8">No bookmarks yet</h3>
                <p className="text-[var(--color7)]">Save posts to find them here later!</p>
              </div>
            ) : (
              bookmarkedPosts.map((post) => <PostCard key={post._id} post={post} onDelete={handlePostDeleted} />)
            )}
          </div>
        );

      case 'friends':
        return (
          <div>
            <div className="_feed_inner_area _b_radious6 _padd_t24 _padd_b24 _padd_r24 _padd_l24 _mar_b16">
              <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--color6)' }}>👥 Find Friends</h3>
              <button onClick={() => setActiveView('feed')} style={{ fontSize: 13, color: '#1890FF', cursor: 'pointer', background: 'none', border: 'none', marginTop: 4 }}>← Back to Feed</button>
            </div>

            {/* Pending Requests */}
            {pendingRequests.length > 0 && (
              <div className="_feed_inner_area _b_radious6 _padd_t24 _padd_b24 _padd_r24 _padd_l24 _mar_b16">
                <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Friend Requests ({pendingRequests.length})</h4>
                {pendingRequests.map((req) => (
                  <div key={req._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <img src={(req.sender as any).avatar || '/assets/images/txt_img.png'} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                      <div>
                        <p style={{ fontWeight: 600, fontSize: 14 }}>{(req.sender as any).firstName} {(req.sender as any).lastName}</p>
                        <p style={{ fontSize: 12, color: '#999' }}>{(req.sender as any).email}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => handleAcceptRequest(req._id, `${(req.sender as any).firstName}`)} style={{ padding: '6px 16px', background: '#1890FF', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>Accept</button>
                      <button onClick={() => handleRejectRequest(req._id)} style={{ padding: '6px 16px', background: '#f5f5f5', color: '#666', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* All Suggestions */}
            <div className="_feed_inner_area _b_radious6 _padd_t24 _padd_b24 _padd_r24 _padd_l24">
              <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>People You May Know</h4>
              {suggestions.length === 0 ? (
                <p style={{ color: '#999', textAlign: 'center', padding: 20 }}>No suggestions available</p>
              ) : (
                suggestions.map((person) => (
                  <div key={person._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <img src={person.avatar || '/assets/images/txt_img.png'} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />
                      <div>
                        <p style={{ fontWeight: 600, fontSize: 14 }}>{person.firstName} {person.lastName}</p>
                        <p style={{ fontSize: 12, color: '#999' }}>{person.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSendRequest(person._id)}
                      disabled={sendingRequest.has(person._id)}
                      style={{ padding: '6px 20px', background: '#1890FF', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer', opacity: sendingRequest.has(person._id) ? 0.6 : 1 }}
                    >
                      {sendingRequest.has(person._id) ? '...' : 'Connect'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      case 'settings':
        return (
          <div>
            <div className="_feed_inner_area _b_radious6 _padd_t24 _padd_b24 _padd_r24 _padd_l24 _mar_b16">
              <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--color6)' }}>⚙️ Settings</h3>
              <button onClick={() => setActiveView('feed')} style={{ fontSize: 13, color: '#1890FF', cursor: 'pointer', background: 'none', border: 'none', marginTop: 4 }}>← Back to Feed</button>
            </div>
            <div className="_feed_inner_area _b_radious6 _padd_t24 _padd_b24 _padd_r24 _padd_l24">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                <img src={user?.avatar || '/assets/images/txt_img.png'} alt="" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }} />
                <div>
                  <h4 style={{ fontSize: 18, fontWeight: 600 }}>{user?.firstName} {user?.lastName}</h4>
                  <p style={{ fontSize: 14, color: '#999' }}>{user?.email}</p>
                </div>
              </div>
              <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
                <p style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>👥 Friends: {friends.length}</p>
                <p style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>📝 Member since: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>
          </div>
        );

      default: // feed
        return (
          <>
            <CreatePost onPostCreated={handlePostCreated} />
            <div className="_feed_posts_list">
              {isLoading ? (
                <><PostCardSkeleton /><PostCardSkeleton /><PostCardSkeleton /></>
              ) : posts.length === 0 ? (
                <div className="_feed_inner_area _b_radious6 _padd_t24 _padd_b24 _padd_r24 _padd_l24 text-center">
                  <div className="text-6xl mb-4">📝</div>
                  <h3 className="text-xl font-semibold text-[var(--color6)] _mar_b8">No posts yet</h3>
                  <p className="text-[var(--color7)]">Be the first to share something!</p>
                </div>
              ) : (
                <>
                  {posts.map((post) => <PostCard key={post._id} post={post} onDelete={handlePostDeleted} />)}
                  {hasMore && (
                    <div className="text-center _mar_t16 _mar_b16">
                      <button onClick={handleLoadMore} disabled={isLoadingMore} className="_feed_inner_text_area_btn_link px-8 py-3 rounded-lg">
                        {isLoadingMore ? 'Loading...' : 'Load More Posts'}
                      </button>
                    </div>
                  )}
                  {!hasMore && posts.length > 0 && (
                    <p className="text-center text-[var(--color7)] _padd_t24 _padd_b24">You&apos;ve reached the end 🎉</p>
                  )}
                </>
              )}
            </div>
          </>
        );
    }
  };

  return (
    <div className="_layout _layout_main_wrapper">
      <Navbar />
      <div className="_main_layout">
        <div className="container _custom_container">
          <div className="_layout_inner_wrap">
            <div className="row">
              {/* ===== LEFT SIDEBAR ===== */}
              <div className="col-xl-3 col-lg-3 col-md-12 col-sm-12 _hide_mobile">
                <div className="_layout_left_sidebar_wrap">
                  {/* Explore Menu */}
                  <div className="_layout_left_sidebar_inner">
                    <div className="_left_inner_area_explore _padd_t24 _padd_b6 _padd_r24 _padd_l24 _b_radious6 _feed_inner_area">
                      <h4 className="_left_inner_area_explore_title _title5 _mar_b24">Explore</h4>
                      <ul className="_left_inner_area_explore_list">
                        {menuItems.map((item, idx) => (
                          <li key={idx} className={`_left_inner_area_explore_item ${item.badge ? '_explore_item' : ''}`}>
                            <button
                              onClick={item.action}
                              className="_left_inner_area_explore_link"
                              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left', padding: '8px 0', fontSize: 14, color: '#666' }}
                            >
                              <span style={{ fontSize: 18 }}>{item.icon}</span> {item.label}
                            </button>
                            {item.badge && <span className="_left_inner_area_explore_link_txt">{item.badge}</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Suggested People — Real Data */}
                  <div className="_layout_left_sidebar_inner">
                    <div className="_left_inner_area_suggest _padd_t24 _padd_b6 _padd_r24 _padd_l24 _b_radious6 _feed_inner_area">
                      <div className="_left_inner_area_suggest_content _mar_b24">
                        <h4 className="_left_inner_area_suggest_content_title _title5">Suggested People</h4>
                        <span className="_left_inner_area_suggest_content_txt">
                          <button onClick={() => setActiveView('friends')} className="_left_inner_area_suggest_content_txt_link" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1890FF' }}>See All</button>
                        </span>
                      </div>
                      {suggestions.slice(0, 3).map((person) => (
                        <div key={person._id} className="_left_inner_area_suggest_info">
                          <div className="_left_inner_area_suggest_info_box">
                            <div className="_left_inner_area_suggest_info_image">
                              <img src={person.avatar || '/assets/images/txt_img.png'} alt="" className="_info_img" />
                            </div>
                            <div className="_left_inner_area_suggest_info_txt">
                              <h4 className="_left_inner_area_suggest_info_title">{person.firstName} {person.lastName}</h4>
                              <p className="_left_inner_area_suggest_info_para">{person.email}</p>
                            </div>
                          </div>
                          <div className="_left_inner_area_suggest_info_link">
                            <button
                              onClick={() => handleSendRequest(person._id)}
                              disabled={sendingRequest.has(person._id)}
                              className="_info_link"
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1890FF', fontSize: 13 }}
                            >
                              {sendingRequest.has(person._id) ? '...' : 'Connect'}
                            </button>
                          </div>
                        </div>
                      ))}
                      {suggestions.length === 0 && (
                        <p style={{ fontSize: 13, color: '#999', textAlign: 'center', padding: '8px 0' }}>No suggestions</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* ===== MIDDLE CONTENT ===== */}
              <div className="col-xl-6 col-lg-6 col-md-12 col-sm-12">
                <div className="_layout_middle_wrap">
                  <div className="_layout_middle_inner">
                    {/* Stories Section */}
                    <div className="_feed_inner_ppl_card _mar_b16">
                      <div className="row">
                        {/* Your Story - add */}
                        <div className="col-xl-3 col-lg-3 col-md-4 col-sm-4 col">
                          <div className="_feed_inner_profile_story _b_radious6">
                            <div className="_feed_inner_profile_story_image" style={{ position: 'relative', cursor: 'pointer' }}>
                              <img src={user?.avatar || '/assets/images/card_ppl1.png'} alt="" className="_profile_story_img" />
                              <div className="_feed_inner_story_txt">
                                <div className="_feed_inner_story_btn">
                                  <label htmlFor="story-upload" className="_feed_inner_story_btn_link" style={{ cursor: storyUploading ? 'wait' : 'pointer' }}>
                                    {storyUploading ? (
                                      <span style={{ fontSize: 10 }}>...</span>
                                    ) : (
                                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 10 10">
                                        <path stroke="#fff" strokeLinecap="round" d="M.5 4.884h9M4.884 9.5v-9" />
                                      </svg>
                                    )}
                                  </label>
                                  <input id="story-upload" type="file" accept="image/*" onChange={handleStoryImageSelect} style={{ display: 'none' }} />
                                </div>
                                <p className="_feed_inner_story_para">Your Story</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Other Stories from DB */}
                        {storyGroups.slice(0, 3).map((group, idx) => (
                          <div key={(group.author as any)._id} className={`col-xl-3 col-lg-3 col-md-4 col-sm-4 ${idx === 2 ? '_custom_none' : idx === 1 ? '_custom_mobile_none' : ''} col`}>
                            <div className="_feed_inner_public_story _b_radious6" onClick={() => setViewingStory({ group, index: 0 })} style={{ cursor: 'pointer' }}>
                              <div className="_feed_inner_public_story_image">
                                <img src={group.stories[0]?.imageUrl || '/assets/images/card_ppl2.png'} alt="" className="_public_story_img" />
                                <div className="_feed_inner_pulic_story_txt">
                                  <p className="_feed_inner_pulic_story_para">{(group.author as any).firstName} {(group.author as any).lastName}</p>
                                </div>
                                <div className="_feed_inner_public_mini">
                                  <img src={(group.author as any).avatar || '/assets/images/mini_pic.png'} alt="" className="_public_mini_img" />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Dynamic Middle Content */}
                    {renderMiddleContent()}
                  </div>
                </div>
              </div>

              {/* ===== RIGHT SIDEBAR ===== */}
              <div className="col-xl-3 col-lg-3 col-md-12 col-sm-12 _hide_mobile">
                <div className="_layout_right_sidebar_wrap">
                  {/* Pending Friend Requests */}
                  {pendingRequests.length > 0 && (
                    <div className="_layout_right_sidebar_inner">
                      <div className="_right_inner_area_info _padd_t24 _padd_b24 _padd_r24 _padd_l24 _b_radious6 _feed_inner_area">
                        <h4 className="_right_inner_area_info_content_title _title5" style={{ marginBottom: 16 }}>Friend Requests ({pendingRequests.length})</h4>
                        {pendingRequests.slice(0, 3).map((req) => (
                          <div key={req._id} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #f0f0f0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                              <img src={(req.sender as any).avatar || '/assets/images/txt_img.png'} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                              <div>
                                <p style={{ fontWeight: 600, fontSize: 13 }}>{(req.sender as any).firstName} {(req.sender as any).lastName}</p>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button onClick={() => handleAcceptRequest(req._id, (req.sender as any).firstName)} style={{ flex: 1, padding: '5px 0', background: '#1890FF', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}>Accept</button>
                              <button onClick={() => handleRejectRequest(req._id)} style={{ flex: 1, padding: '5px 0', background: '#f5f5f5', color: '#666', border: '1px solid #e5e7eb', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}>Reject</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Your Friends — Real Data */}
                  <div className="_layout_right_sidebar_inner">
                    <div className="_feed_right_inner_area_card _padd_t24 _padd_b6 _padd_r24 _padd_l24 _b_radious6 _feed_inner_area">
                      <div className="_feed_top_fixed">
                        <div className="_feed_right_inner_area_card_content _mar_b24">
                          <h4 className="_feed_right_inner_area_card_content_title _title5">Your Friends</h4>
                          <span className="_feed_right_inner_area_card_content_txt">
                            <button onClick={() => setActiveView('friends')} className="_feed_right_inner_area_card_content_txt_link" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1890FF' }}>See All</button>
                          </span>
                        </div>
                      </div>
                      <div className="_feed_bottom_fixed">
                        {friends.length === 0 ? (
                          <p style={{ fontSize: 13, color: '#999', textAlign: 'center', padding: '16px 0' }}>No friends yet. Connect with people!</p>
                        ) : (
                          friends.slice(0, 5).map((friend) => (
                            <div key={friend._id} className="_feed_right_inner_area_card_ppl">
                              <div className="_feed_right_inner_area_card_ppl_box">
                                <div className="_feed_right_inner_area_card_ppl_image">
                                  <img src={friend.avatar || '/assets/images/txt_img.png'} alt="" className="_box_ppl_img" />
                                </div>
                                <div className="_feed_right_inner_area_card_ppl_txt">
                                  <h4 className="_feed_right_inner_area_card_ppl_title">{friend.firstName} {friend.lastName}</h4>
                                  <p className="_feed_right_inner_area_card_ppl_para">{friend.email}</p>
                                </div>
                              </div>
                              <div className="_feed_right_inner_area_card_ppl_side">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 14 14">
                                  <rect width="12" height="12" x="1" y="1" fill="#0ACF83" stroke="#fff" strokeWidth="2" rx="6" />
                                </svg>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== STORY VIEWER MODAL ===== */}
      {viewingStory && (
        <div
          onClick={() => setViewingStory(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ position: 'relative', maxWidth: 420, width: '100%' }}>
            {/* Story Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', color: '#fff' }}>
              <img
                src={(viewingStory.group.author as any).avatar || '/assets/images/txt_img.png'}
                alt=""
                style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid #fff' }}
              />
              <div>
                <p style={{ fontWeight: 600, fontSize: 14 }}>{(viewingStory.group.author as any).firstName} {(viewingStory.group.author as any).lastName}</p>
                <p style={{ fontSize: 11, color: '#ccc' }}>
                  {new Date(viewingStory.group.stories[viewingStory.index]?.createdAt).toLocaleTimeString()}
                </p>
              </div>
              <button onClick={() => setViewingStory(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#fff', fontSize: 24, cursor: 'pointer' }}>✕</button>
            </div>

            {/* Story Image */}
            <img
              src={viewingStory.group.stories[viewingStory.index]?.imageUrl}
              alt="Story"
              style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 8 }}
            />

            {/* Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px' }}>
              <button
                onClick={() => {
                  if (viewingStory.index > 0) setViewingStory({ ...viewingStory, index: viewingStory.index - 1 });
                }}
                disabled={viewingStory.index === 0}
                style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 6, cursor: 'pointer', opacity: viewingStory.index === 0 ? 0.3 : 1 }}
              >
                ← Prev
              </button>
              <span style={{ color: '#fff', fontSize: 13, alignSelf: 'center' }}>
                {viewingStory.index + 1} / {viewingStory.group.stories.length}
              </span>
              <button
                onClick={() => {
                  if (viewingStory.index < viewingStory.group.stories.length - 1) {
                    setViewingStory({ ...viewingStory, index: viewingStory.index + 1 });
                  } else {
                    setViewingStory(null);
                  }
                }}
                style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 6, cursor: 'pointer' }}
              >
                {viewingStory.index < viewingStory.group.stories.length - 1 ? 'Next →' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
