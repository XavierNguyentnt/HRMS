// src/components/Pages/task_components/Followers.js
import React, { useState, useEffect } from "react";
import { Dropdown, Spinner } from "react-bootstrap";
import { FaUserFriends } from "react-icons/fa";
import { fetchFollowers } from "../../../services/api";

const Followers = ({ followerIds }) => {
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadFollowers = async () => {
      if (!followerIds || followerIds.length === 0) {
        setFollowers([]);
        return;
      }
      setLoading(true);
      try {
        const data = await fetchFollowers(followerIds);
        setFollowers(data);
      } catch (error) {
        console.error("Failed to fetch followers", error);
      } finally {
        setLoading(false);
      }
    };
    loadFollowers();
  }, [followerIds]);

  return (
    <Dropdown>
      <Dropdown.Toggle
        variant="link"
        className="text-decoration-none text-secondary p-1">
        <FaUserFriends />
        <sup className="ms-1">{followers.length}</sup>
      </Dropdown.Toggle>
      <Dropdown.Menu>
        <Dropdown.Header>Người theo dõi</Dropdown.Header>
        {loading && (
          <Dropdown.ItemText>
            <Spinner size="sm" />
          </Dropdown.ItemText>
        )}
        {!loading && followers.length === 0 && (
          <Dropdown.ItemText>Chưa có ai.</Dropdown.ItemText>
        )}
        {followers.map((f) => (
          <Dropdown.ItemText key={f.id}>{f.partner_id[1]}</Dropdown.ItemText>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default Followers;
