// src/components/Pages/task_components/FollowButton.js
import React, { useState, useEffect } from "react";
import { Button, Spinner } from "react-bootstrap";
import { useAuth } from "../../../contexts/AuthContext";
import {
  followTask,
  unfollowTask,
  fetchFollowers,
} from "../../../services/api";

const FollowButton = ({ taskId, followerIds, onFollowersChange }) => {
  const { user } = useAuth();
  const [isFollower, setIsFollower] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkIsFollower = async () => {
      if (!user?.partner_id || !followerIds || followerIds.length === 0) {
        setIsFollower(false);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const followers = await fetchFollowers(followerIds);
        const currentUserPartnerId = user.partner_id[0];
        const followerPartnerIds = followers.map((f) => f.partner_id[0]);
        setIsFollower(followerPartnerIds.includes(currentUserPartnerId));
      } catch (error) {
        console.error("Cannot check follower status", error);
      } finally {
        setLoading(false);
      }
    };
    checkIsFollower();
  }, [followerIds, user]);

  const handleToggleFollow = async () => {
    setLoading(true);
    const currentUserPartnerId = user.partner_id[0];
    try {
      if (isFollower) {
        await unfollowTask(taskId, [currentUserPartnerId]);
      } else {
        await followTask(taskId, [currentUserPartnerId]);
      }
      onFollowersChange(); // Báo cho component cha để tải lại dữ liệu
    } catch (error) {
      alert("Thao tác thất bại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="link"
      className="text-decoration-none p-1"
      onClick={handleToggleFollow}
      disabled={loading}>
      {loading ? (
        <Spinner size="sm" />
      ) : isFollower ? (
        "Ngừng theo dõi"
      ) : (
        "Theo dõi"
      )}
    </Button>
  );
};

export default FollowButton;
