import java.io.*;
import java.net.*;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Scanner;

public class Client {
    static Encryption enc = new Encryption();
    static PrintWriter out;
    static BufferedReader in;

    public static void main(String[] args) {
        try {
            String timestamp = new SimpleDateFormat("HHmmssddMMyyyy").format(new Date());
            String logFileName = "client_" + timestamp + ".log";
            PrintWriter logWriter = new PrintWriter(new FileWriter(logFileName, true));
            Socket socket = new Socket("localhost", 1234);
            System.out.println("Connected to the chat server!");

            out = new PrintWriter(socket.getOutputStream(), true);
            in = new BufferedReader(new InputStreamReader(socket.getInputStream()));
            new Thread(new Runnable() {
                @Override
                public void run() {
                    String serverResponse;
                    while ((serverResponse = receiveMessage()) != null) {
                        System.out.println(serverResponse);
                        String cleanResponse = serverResponse.replaceAll("\u001B\\[[;\\d]*m", "");
                        logMessage(logWriter, cleanResponse);
                    }
                }
            }).start();

            Scanner scanner = new Scanner(System.in);
            String userInput;

            while (true) {
                userInput = scanner.nextLine();
                sendMessage(userInput);
            }

        } catch (IOException e) {
            System.out.println(e);
        }
    }

    private static void sendMessage(String message) {
        out.println(enc.rotRev(message));
    }

    private static String receiveMessage() {
        String msg = "";
        try {
            msg = enc.unrotRev(in.readLine());
        } catch (IOException e) {
            System.out.println(e);
        }
        return msg;
    }

    private static void logMessage(PrintWriter logWriter, String message) {
        logWriter.println(message);
        logWriter.flush();
    }
}