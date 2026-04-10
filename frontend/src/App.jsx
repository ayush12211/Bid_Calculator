import React, { useState } from "react";
import CreateAuction from "./components/CreateAuction";
import AuctionRoom from "./components/AuctionRoom";

export default function App() {
  const [auctionId, setAuctionId] = useState(null);

  return auctionId ? (
    <AuctionRoom auctionId={auctionId} onReset={() => setAuctionId(null)} />
  ) : (
    <CreateAuction onCreated={(id) => setAuctionId(id)} />
  );
}
