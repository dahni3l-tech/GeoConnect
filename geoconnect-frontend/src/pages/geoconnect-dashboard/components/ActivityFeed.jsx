// /*import { motion } from 'framer-motion';
// import {
//   RiLoginCircleLine,
//   RiMapPinLine,
//   RiUserAddLine,
//   RiUserFollowLine,
//   RiRefreshLine,
// } from 'react-icons/ri';
// import './ActivityFeed.css';

// const iconMap = {
//   login: RiLoginCircleLine,
//   location: RiMapPinLine,
//   friend_request: RiUserAddLine,
//   friend_accept: RiUserFollowLine,
//   refresh: RiRefreshLine,
// };

// const colorMap = {
//   login: 'blue',
//   location: 'green',
//   friend_request: 'orange',
//   friend_accept: 'purple',
//   refresh: 'teal',
// };

// function ActivityFeed({ activities }) {
//   return (
//     <motion.div
//       className="activity-feed"
//       initial={{ opacity: 0, y: 20 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ duration: 0.4, delay: 0.4 }}
//     >
//       <h3 className="section-title">Recent Activity</h3>
//       <div className="activity-timeline">
//         {activities.map((activity, index) => {
//           const Icon = iconMap[activity.type] || RiRefreshLine;
//           const color = colorMap[activity.type] || 'blue';

//           return (
//             <motion.div
//               key={activity.id}
//               className="activity-item"
//               initial={{ opacity: 0, x: -20 }}
//               animate={{ opacity: 1, x: 0 }}
//               transition={{ delay: 0.5 + index * 0.08 }}
//             >
//               <div className={`activity-icon ${color}`}>
//                 <Icon size={16} />
//               </div>
//               <div className="activity-content">
//                 <p className="activity-message">{activity.message}</p>
//                 <span className="activity-time">{activity.timestamp}</span>
//               </div>
//               {index < activities.length - 1 && (
//                 <div className="activity-connector" />
//               )}
//             </motion.div>
//           );
//         })}
//       </div>
//     </motion.div>
//   );
// }

// export default ActivityFeed;
