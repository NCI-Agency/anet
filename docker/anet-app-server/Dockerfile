    FROM openjdk:8-jre-alpine
	LABEL Vassil Iordanov "vassil.iordanov@gmail.com"
	ADD anet/bin /anet/bin
	ADD anet/lib /anet/lib
	CMD ["server", "/home/anet/anet.yml"]
	ENTRYPOINT ["/anet/bin/anet"]
	EXPOSE 80 443