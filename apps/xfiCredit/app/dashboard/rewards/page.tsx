import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DollarSign, LineChart, Trophy } from "lucide-react";
import React from "react";

interface Irewards {
  id?: string;
  amount?: string;
  duration?: string;
  apy?: string;
  earned?: string;
  status?: string;
}
const Page = () => {
  const rewardsData: Irewards[] = [
    // {
    // 	id: "1234",
    // 	amount: "1,000 EDU",
    // 	duration: "30 Days",
    // 	apy: "12.5%",
    // 	earned: "10.27 EDU",
    // 	status: "Claimable",
    // },
    // {
    // 	id: "2345",
    // 	amount: "500 EDU",
    // 	duration: "60 Days",
    // 	apy: "15.0%",
    // 	earned: "12.33 EDU",
    // 	status: "Accruing",
    // },
    // {
    // 	id: "3456",
    // 	amount: "2,000 EDU",
    // 	duration: "90 Days",
    // 	apy: "18.5%",
    // 	earned: "23.10 EDU",
    // 	status: "Accruing",
    // },
  ];

  return (
    <>
      <div className="flex justify-between flex-wrap gap-5 items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
            Your Rewards
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Track and claim your bonus rewards
          </p>
        </div>
        {/* <Button className="bg-gradient-to-r from-purple-500 to-yellow-500 text-slate-900 font-semibold hover:opacity-90">
					<DollarSign className="w-4 h-4 mr-2" />
					Claim All Rewards
				</Button> */}
        <Button
          disabled
          variant={"default"}
          className="bg-slate-800 !hover:bg-slate-800 text-white font-semibold "
        >
          No rewards available to claim
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="col-span-3 bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 backdrop-blur-sm shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-white">
              Rewards Summary
            </CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400">
              Overview of all your earned rewards
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-100 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700/50">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-slate-500 dark:text-slate-400 text-sm">
                    Available to Claim
                  </span>
                  <div className="p-1.5 bg-yellow-100 dark:bg-yellow-400/20 rounded-md">
                    <DollarSign className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                  0
                </div>
                {/* <div className="text-xs text-indigo-600 dark:text-indigo-400">
									+3.21 EDU since yesterday
								</div> */}
              </div>

              <div className="bg-slate-100 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700/50">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-slate-500 dark:text-slate-400 text-sm">
                    Total Earned
                  </span>
                  <div className="p-1.5 bg-purple-100 dark:bg-purple-400/20 rounded-md">
                    <Trophy className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                  0
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Since you started staking
                </div>
              </div>

              <div className="bg-slate-100 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700/50">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-slate-500 dark:text-slate-400 text-sm">
                    Daily Earnings
                  </span>
                  <div className="p-1.5 bg-yellow-100 dark:bg-yellow-400/20 rounded-md">
                    <LineChart className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                  0
                </div>
                {/* <div className="text-xs text-indigo-600 dark:text-indigo-400">
									+0.45 EDU from learning bonus
								</div> */}
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow className="border-slate-200 dark:border-slate-700/50 hover:bg-transparent">
                  <TableHead className="text-slate-500 dark:text-slate-400">
                    Position ID
                  </TableHead>
                  <TableHead className="text-slate-500 dark:text-slate-400">
                    Amount
                  </TableHead>
                  <TableHead className="text-slate-500 dark:text-slate-400">
                    Duration
                  </TableHead>
                  <TableHead className="text-slate-500 dark:text-slate-400">
                    APY
                  </TableHead>
                  <TableHead className="text-slate-500 dark:text-slate-400">
                    Rewards Earned
                  </TableHead>
                  <TableHead className="text-slate-500 dark:text-slate-400">
                    Status
                  </TableHead>
                  <TableHead className="text-slate-500 dark:text-slate-400">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rewardsData.length <= 0 ? (
                  <TableRow className="text-slate-500 text-xl mx-auto p-5 dark:text-slate-400">
                    <TableCell>No rewards available.</TableCell>
                  </TableRow>
                ) : (
                  rewardsData?.map((reward, index) => (
                    <TableRow
                      key={index}
                      className="border-slate-200 dark:border-slate-700/50"
                    >
                      <TableCell className="font-medium text-slate-900 dark:text-white">
                        #{reward.id}
                      </TableCell>
                      <TableCell>{reward.amount}</TableCell>
                      <TableCell>{reward.duration}</TableCell>
                      <TableCell className="text-indigo-600 dark:text-indigo-400">
                        {reward.apy}
                      </TableCell>
                      <TableCell>{reward.earned}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            reward.status === "Claimable"
                              ? "bg-indigo-100 dark:bg-indigo-400/20 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-400/30"
                              : "bg-yellow-100 dark:bg-yellow-400/20 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-400/30"
                          }
                        >
                          {reward.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={reward.status !== "Claimable"}
                          className={
                            reward.status === "Claimable"
                              ? "border-purple-200 dark:border-purple-500/30 text-indigo-600 dark:text-indigo-400 hover:bg-purple-50 dark:hover:bg-purple-500/10"
                              : "border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500"
                          }
                        >
                          Claim
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Page;
