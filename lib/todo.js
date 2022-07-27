/**
 * TODO: how to march thorugh whatever subnet we are on
 * ? -- this is probably to figure out which LAN ip
 * ? -- addresses we will loop through.
 * ? -- if subnet is like 192.168.0.0/24 then we have
 * ? -- about 255 IP address to send ARP packets to
 *
 *
 */

/** https://unix.stackexchange.com/questions/268926/how-does-fing-or-any-of-the-ip-mac-address-mappers-work
 * *  5
 * *
 * * I just ran Fing against my wireless network. Using tcpdump, it appears that Fing generates
 * * Address Resolution Protocol (ARP) request packets. ARP is a pretty simple protocol that runs
 * * at the Ethernet Protocol level (Data Link, OSI level 2). An ARP request packet has the broadcast
 * * address (ff:ff:ff:ff:ff:ff) as the "to" address, the Android phone's MAC and IP address as
 * * the "from" information, and an IP address that Fing wants to know about. It appears that Fing
 * * just marches through whatever subnet it's on, in my case 172.31.0.0/24, so 255 IP addresses,
 * * from 172.31.0.1 to 172.31.0.254. After the march, it appears to try IP addresses that haven't
 * * responded a second time. This looks to me like Fing tries IP addresses in batches, and relies
 * * on the underlying Linux kernel to buffer ARP replies, for a Fing thread to deal with as fast
 * * as it can. If Fing decides that there's a timeout, it resends. It's not clear to me how Fing
 * * (a Java program) gets the phone's Linux kernel to generate ARP packets.
 * *
 * * The notorious nmap, invoked with -sn, the "ping scan" flag, does the same thing. I did
 * * an strace on nmap -sn 172.31.0.0/24 to see how it gets the kernel to send ARP requests. It
 * * looks like nmap creates an ordinary TCP/IP socket, and calls connect() on the socket to TCP
 * * port 80, with an IP address. nmap must be doing this in non-blocking mode, as it does a large
 * * number of connect() calls sequentially, faster than it would take for Linux to decide to time
 * * out a connect() when there's no host with the IP address.
 * *
 * * So there's your answer: create a TCP/IP socket, call connect() with a particular port and
 * * IP address, then see what the error is. If the error is ECONNREFUSED, it's a live IP address,
 * * but nothing is listening on that port. If you get a TCP connection, that IP address has a host.
 * * IP addresses that the connect() call times out for, don't have a machine associated. You need
 * * to batch the connect() calls for speed, and you need to wait for connect() calls to timeout to
 * * decide that an IP address does not have a machine associated with it.
 * *
 * * Share
 * * Improve this answer
 * * Follow
 * * edited Mar 10, 2016 at 18:32
 * * answered Mar 10, 2016 at 16:43
 * * user732
 * * 2
 * * connect() is not part of it. Nmap uses the platform-dependent implementation
 * * of eth_send in libdnet. For Linux, this uses sendto on a PF_PACkET raw socket. –
 * * bonsaiviking
 * *  Mar 10, 2016 at 19:56
 * * @bonsaiviking - connect() system calls show up for consecutive IP addresses
 * * in the strace output. I was looking for some weird raw socket thing, and I was
 * * surprised to see the connect() calls show up. I did not look through nmap source
 * * code, however, and I also just ran "nmap -sn 172.31.0.0/24", so it's possible
 * * that I missed something important. –
 * * user732
 * *  Mar 10, 2016 at 20:35
 * * @bruce - thanks. This looks like a solid approach, I guess my lack of
 * * experience in the area limited my ability to peice together the tools to
 * * solve the problem - despite having used tcpdump in the past. I just ran a
 * * quick test and see some of the ARP requests coming from FING. When I get back
 * * to the office - I will realy dig into this. –
 * * akaphenom
 * *  Mar 10, 2016 at 22:10
 * * 1
 * * @bonsaiviking - you are correct, in that if you run nmap as root, it does
 * * do the raw socket things. After looking over the source code in nmap..c,
 * * there's a value o.isr00t that when set to false, causes nmap to create regular
 * * TCP sockets, and call connect() on each IP address. When true, it does the raw socket thing. –
 * * user732
 * *  Mar 10, 2016 at 23:02
 */
